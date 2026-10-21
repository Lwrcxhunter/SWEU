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

class IntakeFormController extends Controller
{
    public function edit(Request $request)
    {
        $student = Student::where('user_id', Ids::object($request->user()->id))->first();

        return Inertia::render('Student/IntakeForm', [
            'student' => $student ? StudentInformation::forOwner($student) : null,
            'colleges' => config('guidance.colleges'),
        ]);
    }

    public function store(StudentInformationRequest $request)
    {
        $data = $request->validated();
        DB::transaction(function () use ($request, $data) {
            $student = Student::firstOrNew(['user_id' => Ids::object($request->user()->id)]);
            $student->fill(collect($data)->only([
                'school_id_number', 'year_level', 'phone_number', 'dob', 'marital_status',
                'religious_affiliation', 'facebook_messenger_username',
            ])->all());
            $student->college = collect(config('guidance.colleges'))->firstWhere('code', $data['college_code']);
            $student->address = array_replace($student->address ?? [], $data['address'] ?? []);
            $student->emergency_contact = array_replace($student->emergency_contact ?? [], [
                'name' => $data['emergency_name'], 'phone' => $data['emergency_phone'],
            ], array_key_exists('emergency_relationship', $data)
                ? ['relationship_to_client' => $data['emergency_relationship']] : []);
            // Merge objects without merging numeric condition arrays: unchecking a
            // condition must remove it, while omitted legacy data stays untouched.
            $medical = $data['medical_history'] ?? [];
            $medical['family_medical_history'] = array_replace(
                $student->medical_history['family_medical_history'] ?? [],
                $medical['family_medical_history'] ?? [],
            );
            if (array_key_exists('on_prescription_meds', $medical)) {
                $medical['on_prescription_meds'] = (bool) $medical['on_prescription_meds'];
                if (! $medical['on_prescription_meds']) {
                    $medical['current_meds_specify'] = null;
                }
            }
            if (array_key_exists('recent_surgeries_past_5_yrs', $medical)) {
                $medical['recent_surgeries_past_5_yrs'] = (bool) $medical['recent_surgeries_past_5_yrs'];
                if (! $medical['recent_surgeries_past_5_yrs']) {
                    $medical['surgeries_specify'] = null;
                }
            }
            $student->medical_history = array_replace($student->medical_history ?? [], $medical);
            $student->intake_record = array_replace($student->intake_record ?? [],
                collect($data)->only(['living_condition', 'personal_concerns', 'referred_by'])->all(),
                array_key_exists('is_walk_in', $data) ? ['is_walk_in' => (bool) $data['is_walk_in']] : [], [
                    'signed_agreement' => true, 'is_sworn_truthful' => true,
                    'submitted_at' => new UTCDateTime(now()), 'agreement_version' => config('guidance.agreement_version'),
                ]);
            $student->save();
            if (isset($data['full_name'])) {
                $request->user()->update(['full_name' => $data['full_name']]);
            }
        });

        return to_route('student.dashboard')->with('success', 'Your information has been updated successfully.');
    }

    public static function student(Request $request): Student
    {
        $student = Student::where('user_id', Ids::object($request->user()->id))->first();
        if (! $student || ! ($student->intake_record['signed_agreement'] ?? false) || ! ($student->intake_record['is_sworn_truthful'] ?? false)) {
            throw ValidationException::withMessages(['intake' => 'Complete your intake and both declarations first.']);
        }

        return $student;
    }
}
