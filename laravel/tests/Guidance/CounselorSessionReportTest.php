<?php

namespace Tests\Guidance;

use App\Models\CounselingSession;
use App\Services\CounselingCases;
use App\Support\Ids;

class CounselorSessionReportTest extends GuidanceTestCase
{
    public function test_json_csv_and_printable_exports_are_scoped_and_exclude_clinical_content(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor);
        $appointment->update([
            'initial_visit_questionnaire' => ['reason' => 'Sensitive intake narrative'],
        ]);
        $case = app(CounselingCases::class)->createCaseFromAppointment($appointment->fresh());
        $session = CounselingSession::where('case_id', Ids::object($case->id))->firstOrFail();
        $session->update(['encrypted_session_notes' => 'Sensitive clinical note']);

        $otherCounselor = $this->user('counselor');
        $otherAppointment = $this->appointment($otherCounselor);
        $otherCase = app(CounselingCases::class)->createCaseFromAppointment($otherAppointment);

        $query = '?range=custom&from=2026-10-01&to=2026-10-08&format=json';
        $this->actingAs($counselor)->getJson('/counselor/reports/sessions'.$query)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.Case #', $case->case_number)
            ->assertJsonPath('data.0.Date/Time', '2026-10-05 AM')
            ->assertJsonPath('data.0.Mode', 'F2F')
            ->assertJsonPath('data.0.Case Category', 'general_guidance')
            ->assertDontSee('Sensitive clinical note')
            ->assertDontSee('Sensitive intake narrative');

        $csv = $this->actingAs($counselor)->get('/counselor/reports/sessions?range=custom&from=2026-10-01&to=2026-10-08&format=csv');
        $csv->assertOk()->assertDownload('counselor-sessions.csv');
        $csvContent = $csv->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csvContent);
        $this->assertStringContainsString('"Case #",Date/Time,Mode,Status,"Case Category"', $csvContent);
        $this->assertStringNotContainsString('Sensitive clinical note', $csvContent);
        $this->assertStringNotContainsString('Sensitive intake narrative', $csvContent);

        $print = $this->actingAs($counselor)->get('/counselor/reports/sessions?range=custom&from=2026-10-01&to=2026-10-08&format=pdf');
        $print->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=UTF-8')
            ->assertSee($case->case_number)
            ->assertSee('window.print()')
            ->assertDontSee('Sensitive clinical note')
            ->assertDontSee('Sensitive intake narrative');

        $this->actingAs($otherCounselor)->getJson('/counselor/reports/sessions'.$query)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.Case #', $otherCase->case_number);
    }

    public function test_counselor_export_validates_format_and_date_range(): void
    {
        $counselor = $this->user('counselor');
        $this->actingAs($counselor)->getJson('/counselor/reports/sessions?range=custom&from=2026-10-09&to=2026-10-08&format=pdf')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('to');
        $this->getJson('/counselor/reports/sessions?range=custom&from=2026-10-01&to=2026-10-08&format=xml')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('format');
        $this->getJson('/counselor/reports/sessions?range=custom&format=json')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['from', 'to']);
        $this->actingAs($this->user('staff'))->getJson('/counselor/reports/sessions?range=week&format=json')->assertForbidden();
    }
}
