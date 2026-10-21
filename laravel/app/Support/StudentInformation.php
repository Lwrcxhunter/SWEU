<?php

namespace App\Support;

use App\Models\Student;
use App\Models\User;

class StudentInformation
{
    // Only call for the authenticated student's own document. Operational
    // student views deliberately use the narrower Views::student projection.
    public static function forOwner(Student $student): array
    {
        $user = User::find($student->user_id);
        $nameParts = explode(' ', trim($user?->full_name ?? ''));
        $defaultFirst = $nameParts[0] ?? '';
        $defaultLast = count($nameParts) > 1 ? end($nameParts) : '';
        $defaultMiddle = count($nameParts) > 2 ? implode(' ', array_slice($nameParts, 1, -1)) : '';

        $personal = $student->personal_details ?? [];
        $addr = $student->address ?? [];
        $med = $student->medical_history ?? [];

        $collegeCode = is_array($student->college) ? ($student->college['code'] ?? '') : ($student->college ?? ($personal['college'] ?? ''));

        $dobStr = null;
        if (! empty($personal['dob'])) {
            $dobStr = $personal['dob'] instanceof \DateTimeInterface
                ? $personal['dob']->format('Y-m-d')
                : substr((string) $personal['dob'], 0, 10);
        } elseif ($student->dob) {
            $dobStr = $student->dob->format('Y-m-d');
        }

        $addrOutput = empty($addr) ? [] : [
            'province' => $addr['province'] ?? $addr['state_province'] ?? '',
            'city_municipality' => $addr['city_municipality'] ?? $addr['city'] ?? '',
            'barangay' => $addr['barangay'] ?? '',
            'zip_code' => $addr['zip_code'] ?? $addr['postal_zip'] ?? '',
            'street_subdivision' => $addr['street_subdivision'] ?? $addr['street'] ?? '',
            'street' => $addr['street_subdivision'] ?? $addr['street'] ?? '',
            'city' => $addr['city_municipality'] ?? $addr['city'] ?? '',
            'state_province' => $addr['province'] ?? $addr['state_province'] ?? '',
            'postal_zip' => $addr['zip_code'] ?? $addr['postal_zip'] ?? '',
        ];

        $medOutput = empty($med) ? null : [
            'conditions' => $med['conditions'] ?? [],
            'family_medical_history_notes' => $med['family_medical_history_notes'] ?? ($med['other_conditions_specify'] ?? ''),
            'substance_use' => [
                'tobacco_vape' => $med['substance_use']['tobacco_vape'] ?? $med['family_medical_history']['tobacco_cigarettes_vape_use'] ?? 'No',
                'alcohol' => $med['substance_use']['alcohol'] ?? $med['family_medical_history']['alcohol_use'] ?? 'No',
                'caffeine' => $med['substance_use']['caffeine'] ?? $med['family_medical_history']['caffeine_use'] ?? 'No',
                'drugs' => $med['substance_use']['drugs'] ?? $med['family_medical_history']['drug_use'] ?? 'No',
            ],
            'on_prescription_meds' => $med['on_prescription_meds'] ?? false,
            'current_meds_specify' => $med['current_meds_specify'] ?? null,
            'recent_surgeries_past_5_yrs' => $med['recent_surgeries_past_5_yrs'] ?? false,
            'surgeries_specify' => $med['surgeries_specify'] ?? null,
            'other_conditions_specify' => $med['other_conditions_specify'] ?? null,
            'family_medical_history' => $med['family_medical_history'] ?? [
                'tobacco_cigarettes_vape_use' => $med['substance_use']['tobacco_vape'] ?? '',
                'alcohol_use' => $med['substance_use']['alcohol'] ?? '',
                'caffeine_use' => $med['substance_use']['caffeine'] ?? '',
                'drug_use' => $med['substance_use']['drugs'] ?? '',
            ],
        ];

        return [
            'personal_details' => [
                'first_name' => $personal['first_name'] ?? $defaultFirst,
                'middle_name' => $personal['middle_name'] ?? $defaultMiddle,
                'last_name' => $personal['last_name'] ?? $defaultLast,
                'school_id_number' => $personal['school_id_number'] ?? $student->school_id_number ?? '',
                'college' => $collegeCode,
                'program' => $personal['program'] ?? '',
                'year_level' => (int) ($personal['year_level'] ?? $student->year_level ?? 1),
                'dob' => $dobStr,
                'marital_status' => $personal['marital_status'] ?? $student->marital_status ?? 'Single',
                'phone_number' => $personal['phone_number'] ?? $student->phone_number ?? '',
            ],
            'address' => $addrOutput,
            'emergency_contact' => $student->emergency_contact ?? [],
            'medical_history' => $medOutput,
            'school_id_number' => $personal['school_id_number'] ?? $student->school_id_number ?? '',
            'college' => $student->college,
            'year_level' => (int) ($personal['year_level'] ?? $student->year_level ?? 1),
            'phone_number' => $personal['phone_number'] ?? $student->phone_number ?? '',
            'dob' => $dobStr,
            'marital_status' => $personal['marital_status'] ?? $student->marital_status ?? 'Single',
            'religious_affiliation' => $student->religious_affiliation ?? '',
            'facebook_messenger_username' => $student->facebook_messenger_username ?? '',
            'intake_record' => collect($student->intake_record ?? [])->only([
                'signed_agreement', 'is_sworn_truthful', 'submitted_at',
            ])->all(),
        ];
    }
}
