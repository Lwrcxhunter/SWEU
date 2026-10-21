<?php

namespace App\Http\Requests;

use App\Models\Student;
use App\Support\Ids;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentInformationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'student' && $this->user()->checkPermissionTo('intake.manage');
    }

    protected function prepareForValidation(): void
    {
        // Support backward compatibility for full_name
        if (! $this->has('first_name')) {
            $name = $this->input('full_name') ?: ($this->user()?->full_name ?? 'Student Test');
            $parts = explode(' ', trim((string) $name));
            $this->merge([
                'first_name' => $parts[0] ?? 'Student',
                'last_name' => count($parts) > 1 ? end($parts) : 'Student',
                'middle_name' => count($parts) > 2 ? implode(' ', array_slice($parts, 1, -1)) : null,
            ]);
        }

        // Support backward compatibility for college_code
        if (! $this->has('college') && $this->has('college_code')) {
            $this->merge(['college' => $this->input('college_code')]);
        }

        // Default year_level to integer
        if ($this->has('year_level')) {
            $this->merge(['year_level' => (int) $this->input('year_level')]);
        }

        // Normalize address keys if legacy format passed or default if missing
        if (! $this->has('address')) {
            $this->merge([
                'address' => [
                    'province' => 'Bukidnon',
                    'city_municipality' => 'Malaybalay City',
                    'barangay' => '',
                    'zip_code' => '8700',
                    'street_subdivision' => '',
                    'state_province' => 'Bukidnon',
                    'city' => 'Malaybalay City',
                    'street' => '',
                    'postal_zip' => '8700',
                ],
            ]);
        } else {
            $addr = (array) $this->input('address', []);
            if (! isset($addr['province']) && isset($addr['state_province'])) {
                $addr['province'] = $addr['state_province'];
            }
            if (! isset($addr['city_municipality']) && isset($addr['city'])) {
                $addr['city_municipality'] = $addr['city'];
            }
            if (! isset($addr['zip_code']) && isset($addr['postal_zip'])) {
                $addr['zip_code'] = $addr['postal_zip'];
            }
            if (! isset($addr['street_subdivision']) && isset($addr['street'])) {
                $addr['street_subdivision'] = $addr['street'];
            }
            if (isset($addr['province']) && ! isset($addr['state_province'])) {
                $addr['state_province'] = $addr['province'];
            }
            if (isset($addr['city_municipality']) && ! isset($addr['city'])) {
                $addr['city'] = $addr['city_municipality'];
            }
            $this->merge(['address' => $addr]);
        }
    }

    public function rules(): array
    {
        $student = Student::where('user_id', Ids::object($this->user()->id))->first();
        $phone = ['required', 'string', 'regex:/^(09\d{9}|\+639\d{9})$/'];
        $substanceOptions = ['No', 'Daily', 'Weekly', 'Less', 'Former User'];

        $collegeCodes = array_column(config('guidance.colleges'), 'code');
        $collegeCodes[] = 'COB'; // Allow legacy code

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'full_name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'school_id_number' => [
                'required', 'string',
                'regex:' . config('guidance.student_id_pattern'),
                Rule::unique('students', 'school_id_number')->ignore($student?->id),
            ],
            'college' => ['required', Rule::in($collegeCodes)],
            'college_code' => ['sometimes', 'nullable', 'string'],
            'program' => ['nullable', 'string', 'max:250'],
            'year_level' => ['required', Rule::in([1, 2, 3, 4, '1', '2', '3', '4'])],
            'phone_number' => $phone,
            'dob' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'marital_status' => ['nullable', 'string', 'max:100'],

            // Address fields
            'address' => ['required', 'array'],
            'address.province' => ['sometimes', 'string', 'max:150'],
            'address.city_municipality' => ['sometimes', 'string', 'max:150'],
            'address.barangay' => ['nullable', 'string', 'max:150'],
            'address.zip_code' => ['nullable', 'string', 'max:20'],
            'address.street_subdivision' => ['nullable', 'string', 'max:250'],
            // Legacy address keys
            'address.street' => ['nullable', 'string', 'max:250'],
            'address.city' => ['sometimes', 'string', 'max:150'],
            'address.state_province' => ['nullable', 'string', 'max:150'],
            'address.postal_zip' => ['nullable', 'string', 'max:20'],

            // Medical history
            'medical_history' => ['sometimes', 'array'],
            'medical_history.conditions' => ['sometimes', 'array', 'max:30'],
            'medical_history.conditions.*' => ['required', 'string', 'max:100', 'distinct'],
            'medical_history.family_medical_history_notes' => ['nullable', 'string', 'max:3000'],
            'medical_history.substance_use' => ['sometimes', 'array'],
            'medical_history.substance_use.tobacco_vape' => ['nullable', Rule::in($substanceOptions)],
            'medical_history.substance_use.alcohol' => ['nullable', Rule::in($substanceOptions)],
            'medical_history.substance_use.caffeine' => ['nullable', Rule::in($substanceOptions)],
            'medical_history.substance_use.drugs' => ['nullable', Rule::in($substanceOptions)],

            // Legacy medical/intake keys (allowed so old tests or intake data don't fail)
            'medical_history.other_conditions_specify' => [
                Rule::requiredIf(fn () => in_array('Other', (array) $this->input('medical_history.conditions', []))),
                'nullable', 'string', 'max:2000',
            ],
            'medical_history.on_prescription_meds' => ['sometimes', 'boolean'],
            'medical_history.current_meds_specify' => [
                Rule::requiredIf(fn () => (bool) $this->input('medical_history.on_prescription_meds')),
                'nullable', 'string', 'max:2000',
            ],
            'medical_history.recent_surgeries_past_5_yrs' => ['sometimes', 'boolean'],
            'medical_history.surgeries_specify' => [
                Rule::requiredIf(fn () => (bool) $this->input('medical_history.recent_surgeries_past_5_yrs')),
                'nullable', 'string', 'max:2000',
            ],
            'medical_history.family_medical_history' => ['sometimes', 'array'],
            'medical_history.family_medical_history.*' => ['nullable', 'string', 'max:1000'],

            'emergency_name' => ['nullable', 'string', 'max:150'],
            'emergency_phone' => ['nullable', 'string'],
            'emergency_relationship' => ['nullable', 'string', 'max:100'],
            'is_walk_in' => ['sometimes', 'boolean'],
            'referred_by' => ['nullable', 'string', 'max:150'],
            'living_condition' => ['nullable', 'string', 'max:1000'],
            'personal_concerns' => ['nullable', 'array', 'max:10'],
            'personal_concerns.*' => ['nullable', 'string', 'max:500'],

            // Declarations
            'is_sworn_truthful' => ['required', 'accepted'],
            'signed_agreement' => ['required', 'accepted'],
        ];
    }
}
