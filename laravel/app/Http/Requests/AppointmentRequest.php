<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AppointmentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $channel = $this->input('channel', 'face_to_face');
        $period = $this->input('preferred_period');
        $this->merge([
            'channel' => in_array($channel, ['online', 'telecounseling'], true) ? 'virtual' : $channel,
            'preferred_period' => is_string($period) ? strtolower($period) : $period,
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'channel' => ['required', Rule::in(['face_to_face', 'virtual'])],
            'scheduled_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'scheduled_time' => ['required_without:preferred_period', 'nullable', 'date_format:H:i', 'regex:/^(?:(?:0[89]|1[0-6]):(?:00|30)|17:00)$/'],
            'preferred_period' => ['required_without:scheduled_time', 'nullable', Rule::in(['am', 'pm'])],
            'reason' => ['nullable', 'string', 'max:2000'],
            'expectations' => ['nullable', 'string', 'max:2000'],
            'average_sleep' => ['nullable', 'string', 'max:50'],
            'prior_consultation' => ['nullable', 'boolean'],
            'prior_consultation_details' => ['nullable', 'string', 'max:2000'],
            'additional_comments' => ['nullable', 'string', 'max:2000'],
            'signature' => ['nullable', 'string', 'max:200000'],
            'signature_data' => ['nullable', 'string', 'max:200000'],
            'signed_declaration' => ['nullable', 'boolean'],
            'is_sworn_truthful' => ['nullable', 'boolean'],
            'ethical_use_consent' => ['nullable', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [function ($validator) {
            if (! $validator->errors()->any() && $this->scheduled_time && $this->scheduled_date.' '.$this->scheduled_time <= now()->format('Y-m-d H:i')) {
                $validator->errors()->add('scheduled_time', 'Choose a future appointment time (Philippine time).');
            }
        }];
    }
}
