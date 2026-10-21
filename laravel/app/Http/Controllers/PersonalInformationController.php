<?php

namespace App\Http\Controllers;

use App\Http\Requests\StudentInformationRequest;
use App\Models\Student;
use App\Support\Ids;
use App\Support\StudentInformation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use MongoDB\BSON\UTCDateTime;

class PersonalInformationController extends Controller
{
    public function edit(Request $request)
    {
        $student = Student::where('user_id', Ids::object($request->user()->id))->first();

        return Inertia::render('Student/PersonalInformation', [
            'student' => $student ? StudentInformation::forOwner($student) : null,
            'colleges' => config('guidance.colleges'),
            'programs' => config('guidance.programs'),
        ]);
    }

    public function store(StudentInformationRequest $request)
    {
        $data = $request->validated();
        DB::transaction(function () use ($request, $data) {
            $student = Student::firstOrNew(['user_id' => Ids::object($request->user()->id)]);

            $collegeCode = $data['college'] ?? ($data['college_code'] ?? 'CAS');
            $collegeObj = collect(config('guidance.colleges'))->firstWhere('code', $collegeCode);
            $collegeName = $collegeObj['name'] ?? $collegeCode;

            $firstName = $data['first_name'];
            $middleName = $data['middle_name'] ?? null;
            $lastName = $data['last_name'];
            $fullName = trim("{$firstName} {$middleName} {$lastName}");

            $dobDate = ! empty($data['dob']) ? new UTCDateTime(new \DateTimeImmutable($data['dob'])) : null;

            $personalDetails = [
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'last_name' => $lastName,
                'school_id_number' => $data['school_id_number'],
                'college' => $collegeName,
                'program' => $data['program'] ?? '',
                'year_level' => (int) $data['year_level'],
                'dob' => $dobDate,
                'marital_status' => $data['marital_status'] ?? 'Single',
                'phone_number' => $data['phone_number'],
            ];

            $addrInput = $data['address'] ?? [];
            $address = [
                'province' => $addrInput['province'] ?? ($addrInput['state_province'] ?? ''),
                'city_municipality' => $addrInput['city_municipality'] ?? ($addrInput['city'] ?? ''),
                'barangay' => $addrInput['barangay'] ?? '',
                'zip_code' => $addrInput['zip_code'] ?? ($addrInput['postal_zip'] ?? ''),
                'street_subdivision' => $addrInput['street_subdivision'] ?? ($addrInput['street'] ?? ''),
                // Keep backward compatibility keys
                'state_province' => $addrInput['province'] ?? ($addrInput['state_province'] ?? ''),
                'city' => $addrInput['city_municipality'] ?? ($addrInput['city'] ?? ''),
                'street' => $addrInput['street_subdivision'] ?? ($addrInput['street'] ?? ''),
                'postal_zip' => $addrInput['zip_code'] ?? ($addrInput['postal_zip'] ?? ''),
            ];

            $medicalHistory = $student->medical_history ?? [];
            if (isset($data['medical_history']['conditions'])) {
                $medicalHistory['conditions'] = $data['medical_history']['conditions'];
            }
            if (array_key_exists('family_medical_history_notes', $data['medical_history'] ?? [])) {
                $medicalHistory['family_medical_history_notes'] = $data['medical_history']['family_medical_history_notes'];
            }
            if (isset($data['medical_history']['substance_use'])) {
                $medicalHistory['substance_use'] = array_replace(
                    $medicalHistory['substance_use'] ?? [],
                    $data['medical_history']['substance_use']
                );
            }
            if (isset($data['medical_history']['family_medical_history'])) {
                $medicalHistory['family_medical_history'] = array_replace(
                    $student->medical_history['family_medical_history'] ?? [],
                    $data['medical_history']['family_medical_history']
                );
            }
            // Keep legacy medical keys
            if (isset($data['medical_history']['on_prescription_meds'])) {
                $medicalHistory['on_prescription_meds'] = (bool) $data['medical_history']['on_prescription_meds'];
                $medicalHistory['current_meds_specify'] = $medicalHistory['on_prescription_meds'] ? ($data['medical_history']['current_meds_specify'] ?? null) : null;
            }
            if (isset($data['medical_history']['recent_surgeries_past_5_yrs'])) {
                $medicalHistory['recent_surgeries_past_5_yrs'] = (bool) $data['medical_history']['recent_surgeries_past_5_yrs'];
                $medicalHistory['surgeries_specify'] = $medicalHistory['recent_surgeries_past_5_yrs'] ? ($data['medical_history']['surgeries_specify'] ?? null) : null;
            }
            if (isset($data['medical_history']['other_conditions_specify'])) {
                $medicalHistory['other_conditions_specify'] = $data['medical_history']['other_conditions_specify'];
            }

            $student->personal_details = $personalDetails;
            $student->address = $address;
            $student->medical_history = $medicalHistory;

            // Mirror top-level compatibility attributes
            $student->school_id_number = $data['school_id_number'];
            $student->college = $collegeObj ?? ['code' => $collegeCode, 'name' => $collegeName];
            $student->year_level = (int) $data['year_level'];
            $student->phone_number = $data['phone_number'];
            if ($dobDate) {
                $student->dob = $dobDate;
            }
            $student->marital_status = $data['marital_status'] ?? 'Single';

            if (isset($data['emergency_name'])) {
                $student->emergency_contact = array_replace($student->emergency_contact ?? [], [
                    'name' => $data['emergency_name'],
                    'phone' => $data['emergency_phone'] ?? '',
                ], array_key_exists('emergency_relationship', $data) ? ['relationship_to_client' => $data['emergency_relationship']] : []);
            }

            $student->intake_record = array_replace(
                $student->intake_record ?? [],
                collect($data)->only(['living_condition', 'personal_concerns', 'referred_by'])->all(),
                array_key_exists('is_walk_in', $data) ? ['is_walk_in' => (bool) $data['is_walk_in']] : [],
                [
                    'signed_agreement' => true,
                    'is_sworn_truthful' => true,
                    'submitted_at' => new UTCDateTime(now()),
                    'agreement_version' => config('guidance.agreement_version'),
                ]
            );

            $student->save();
            $request->user()->update(['full_name' => $fullName]);
        });

        return to_route('student.dashboard')->with('success', 'Your information has been updated successfully.');
    }

    public static function student(Request $request): Student
    {
        $student = Student::where('user_id', Ids::object($request->user()->id))->first();
        if (! $student || ! ($student->intake_record['signed_agreement'] ?? false) || ! ($student->intake_record['is_sworn_truthful'] ?? false)) {
            throw ValidationException::withMessages(['intake' => 'Complete your personal information and declaration first.']);
        }

        return $student;
    }
}
