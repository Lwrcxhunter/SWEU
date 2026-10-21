<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1a202c;
            line-height: 1.4;
            font-size: 10pt;
            background-color: #fff;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 14mm;
            box-sizing: border-box;
        }
        
        /* Table layout to repeat header across all printed pages */
        table.report-wrapper {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            border: none;
            margin: 0;
            padding: 0;
        }
        table.report-wrapper > thead {
            display: table-header-group;
        }
        table.report-wrapper > tbody {
            display: table-row-group;
        }
        table.report-wrapper > thead > tr > td,
        table.report-wrapper > tbody > tr > td {
            border: none;
            padding: 0;
            margin: 0;
            vertical-align: top;
        }

        /* Repeating Header Styling */
        .header {
            width: 100%;
            padding-top: 10mm;
            padding-bottom: 8px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            page-break-after: avoid;
        }
        .header-top {
            display: table;
            width: 100%;
            margin-bottom: 2px;
        }
        .logo-box {
            display: table-cell;
            width: 75px;
            vertical-align: middle;
            text-align: left;
        }
        .header-logo {
            width: 72px;
            height: 72px;
            object-fit: contain;
            display: block;
        }
        .univ-info {
            display: table-cell;
            vertical-align: middle;
            text-align: center;
            padding-right: 75px; /* Balances left logo to keep text centered */
        }
        .univ-title {
            font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif;
            font-size: 13.5pt;
            font-weight: 700;
            color: #111827;
            margin: 0 0 2px 0;
            letter-spacing: 0.3px;
            line-height: 1.2;
            text-align: center;
        }
        .univ-address {
            font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif;
            font-size: 9.5pt;
            color: #374151;
            margin: 0 0 2px 0;
            line-height: 1.2;
            text-align: center;
        }
        .univ-contact {
            font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif;
            font-size: 9pt;
            color: #374151;
            margin: 0;
            line-height: 1.2;
            text-align: center;
        }
        .univ-url {
            color: #1d4ed8;
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        .header-divider {
            width: 100%;
            border-bottom: 1.2px solid #8b99a8;
            margin: 6px 0 8px 0;
        }
        .header-unit {
            text-align: center;
        }
        .unit-title {
            font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif;
            font-size: 10.5pt;
            font-weight: 700;
            color: #111827;
            letter-spacing: 0.4px;
            margin: 0 0 2px 0;
            line-height: 1.2;
        }
        .services-title {
            font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif;
            font-size: 10pt;
            font-weight: 600;
            color: #1f2937;
            letter-spacing: 0.3px;
            margin: 0 0 8px 0;
            line-height: 1.2;
        }
        .form-title {
            font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif;
            font-size: 12pt;
            font-weight: 800;
            color: #111827;
            letter-spacing: 0.6px;
            margin: 0 0 4px 0;
            line-height: 1.2;
        }

        /* Sections & Grids */
        .section {
            margin-bottom: 14px;
            page-break-inside: avoid;
        }
        .section-header {
            background-color: #f0fdf4;
            border-left: 4px solid #0f4c3a;
            padding: 4px 8px;
            font-size: 9pt;
            font-weight: 700;
            color: #0f4c3a;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 6px;
        }
        table.grid {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
        }
        table.grid td, table.grid th {
            padding: 4px 7px;
            vertical-align: top;
            border: 1px solid #e2e8f0;
        }
        table.grid th {
            background-color: #f8fafc;
            font-weight: 600;
            color: #4a5568;
            width: 25%;
            text-align: left;
        }
        .badge {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 7.5pt;
            font-weight: 600;
            background-color: #e2e8f0;
            color: #334155;
        }
        .badge-yes {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .badge-no {
            background-color: #f1f5f9;
            color: #475569;
        }
        .page-2-wrapper {
            page-break-before: always;
            break-before: page;
            display: flex;
            flex-direction: column;
            min-height: 208mm;
            box-sizing: border-box;
            padding-bottom: 6mm;
        }
        .last-page-bottom-block {
            margin-top: auto;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .declaration-box {
            border: 1px dashed #0f4c3a;
            background-color: #fcfdfd;
            padding: 8px 12px;
            font-size: 8pt;
            border-radius: 6px;
            margin-top: 16px;
            line-height: 1.45;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .signature-block {
            margin-top: 22px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .signature-box {
            width: 46%;
            text-align: center;
        }
        .signature-line {
            border-bottom: 1.5px solid #1a202c;
            min-height: 44px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 3px;
        }
        .signature-line img {
            max-height: 42px;
            max-width: 190px;
        }
        .signature-line .cursive-text {
            font-family: "Brush Script MT", "Caveat", "Segoe Script", cursive;
            font-size: 17pt;
            color: #0f4c3a;
        }
        .signature-caption {
            margin-top: 5px;
            font-size: 8pt;
            font-weight: 600;
            color: #2d3748;
        }
        .footer {
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid #cbd5e1;
            font-size: 7.5pt;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            align-items: center;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        @media print {
            body { font-size: 9.5pt; }
            .no-print { display: none; }
            table.report-wrapper thead {
                display: table-header-group;
            }
            table.report-wrapper tbody {
                display: table-row-group;
            }
            .page-2-wrapper {
                min-height: 208mm;
            }
        }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('images/buksu-logo.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';
        $personal = $studentInfo['personal_details'] ?? [];
        $address = $studentInfo['address'] ?? [];
        $emergency = $studentInfo['emergency_contact'] ?? [];
        $med = $studentInfo['medical_history'] ?? [];
        $q = $appointment->initial_visit_questionnaire ?? [];
    @endphp

    <div class="container">
        <table class="report-wrapper">
            <thead>
                <tr>
                    <td>
                        <!-- Official BukSU Header Layout (Repeats on every printed page) -->
                        <div class="header">
                            <div class="header-top">
                                @if(!empty($logoBase64))
                                    <div class="logo-box">
                                        <img src="{{ $logoBase64 }}" alt="BukSU Logo" class="header-logo">
                                    </div>
                                @endif
                                <div class="univ-info">
                                    <h1 class="univ-title">BUKIDNON STATE UNIVERSITY</h1>
                                    <p class="univ-address">Malaybalay City, Bukidnon 8700</p>
                                    <p class="univ-contact">Tel (088) 813-5661 to 5663; Telefax (088) 813-2717, <a href="https://www.buksu.edu.ph" target="_blank" class="univ-url">www.buksu.edu.ph</a></p>
                                </div>
                            </div>
                            <div class="header-divider"></div>
                            <div class="header-unit">
                                <div class="unit-title">STUDENT WELFARE AND ENGAGEMENT UNIT</div>
                                <div class="services-title">GUIDANCE AND COUNSELING SERVICES</div>
                                <div class="form-title">COUNSELING INTAKE FORM</div>
                            </div>
                        </div>
                    </td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <div class="report-content">
                            <!-- 01 / Personal & Academic Details -->
                            <div class="section">
                                <div class="section-header">01 / Personal & Academic Details</div>
                                <table class="grid">
                                    <tr>
                                        <th>Full Name</th>
                                        <td colspan="3">
                                            <strong>{{ $personal['last_name'] ?? '' }}, {{ $personal['first_name'] ?? '' }} {{ $personal['middle_name'] ?? '' }}</strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Student ID Number</th>
                                        <td>{{ $personal['school_id_number'] ?? $student->school_id_number ?? 'N/A' }}</td>
                                        <th>College / Unit</th>
                                        <td>{{ $personal['college'] ?? (is_array($student->college) ? ($student->college['name'] ?? $student->college['code']) : $student->college) }}</td>
                                    </tr>
                                    <tr>
                                        <th>Academic Program</th>
                                        <td>{{ $personal['program'] ?? 'Not specified' }}</td>
                                        <th>Year Level</th>
                                        <td>{{ $personal['year_level'] ?? $student->year_level ?? 'N/A' }}</td>
                                    </tr>
                                    <tr>
                                        <th>Date of Birth</th>
                                        <td>{{ $personal['dob'] ?? ($student->dob ? $student->dob->format('F d, Y') : 'N/A') }}</td>
                                        <th>Marital Status</th>
                                        <td>{{ $personal['marital_status'] ?? 'Single' }}</td>
                                    </tr>
                                    <tr>
                                        <th>Phone / Contact</th>
                                        <td>{{ $personal['phone_number'] ?? $student->phone_number ?? 'N/A' }}</td>
                                        <th>Facebook Messenger</th>
                                        <td>{{ $studentInfo['facebook_messenger_username'] ?? 'N/A' }}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- 02 / Residential Address -->
                            <div class="section">
                                <div class="section-header">02 / Residential Address</div>
                                <table class="grid">
                                    <tr>
                                        <th>Street / Subdivision / House No.</th>
                                        <td colspan="3">{{ $address['street_subdivision'] ?? ($address['street'] ?? 'N/A') }}</td>
                                    </tr>
                                    <tr>
                                        <th>Barangay</th>
                                        <td>{{ $address['barangay'] ?? 'N/A' }}</td>
                                        <th>City / Municipality</th>
                                        <td>{{ $address['city_municipality'] ?? ($address['city'] ?? 'N/A') }}</td>
                                    </tr>
                                    <tr>
                                        <th>Province</th>
                                        <td>{{ $address['province'] ?? ($address['state_province'] ?? 'N/A') }}</td>
                                        <th>Postal / ZIP Code</th>
                                        <td>{{ $address['zip_code'] ?? ($address['postal_zip'] ?? 'N/A') }}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- 03 / Emergency Contact -->
                            <div class="section">
                                <div class="section-header">03 / Emergency Contact</div>
                                <table class="grid">
                                    <tr>
                                        <th>Contact Person</th>
                                        <td><strong>{{ $emergency['name'] ?? 'N/A' }}</strong></td>
                                        <th>Relationship to Student</th>
                                        <td>{{ $emergency['relationship_to_client'] ?? 'N/A' }}</td>
                                    </tr>
                                    <tr>
                                        <th>Emergency Phone</th>
                                        <td colspan="3">{{ $emergency['phone'] ?? 'N/A' }}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- 04 / Medical History & Substance Usage -->
                            <div class="section">
                                <div class="section-header">04 / Medical History & Substance Usage</div>
                                <table class="grid">
                                    <tr>
                                        <th>Existing Medical Conditions</th>
                                        <td colspan="3">
                                            @if(!empty($med['conditions']) && count($med['conditions']) > 0)
                                                {{ implode(', ', $med['conditions']) }}
                                            @else
                                                <span style="color: #64748b;">No chronic medical conditions disclosed.</span>
                                            @endif
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Prescription Medication</th>
                                        <td>
                                            @if(!empty($med['taking_medication']))
                                                <span class="badge badge-yes">YES</span>
                                                @if(!empty($med['medication_details']))
                                                    ({{ $med['medication_details'] }})
                                                @endif
                                            @else
                                                <span class="badge badge-no">NO</span>
                                            @endif
                                        </td>
                                        <th>Surgeries in Past 5 Years</th>
                                        <td>
                                            @if(!empty($med['past_surgeries']))
                                                <span class="badge badge-yes">YES</span>
                                                @if(!empty($med['surgery_details']))
                                                    ({{ $med['surgery_details'] }})
                                                @endif
                                            @else
                                                <span class="badge badge-no">NO</span>
                                            @endif
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Family Medical History Notes</th>
                                        <td colspan="3">
                                            {{ $med['family_medical_history_notes'] ?? 'None recorded.' }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Substance Usage Questionnaire</th>
                                        <td colspan="3">
                                            @php
                                                $sub = $med['substance_use'] ?? [];
                                            @endphp
                                            <table style="width: 100%; border: none; font-size: 8.5pt;">
                                                <tr>
                                                    <td style="border: none; padding: 2px 4px; width: 50%;">
                                                        &bull; Tobacco / Cigarettes / Vape: <strong>{{ $sub['tobacco_vape'] ?? 'No' }}</strong>
                                                    </td>
                                                    <td style="border: none; padding: 2px 4px; width: 50%;">
                                                        &bull; Alcohol Consumption: <strong>{{ $sub['alcohol'] ?? 'No' }}</strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="border: none; padding: 2px 4px;">
                                                        &bull; Caffeine Usage: <strong>{{ $sub['caffeine'] ?? 'No' }}</strong>
                                                    </td>
                                                    <td style="border: none; padding: 2px 4px;">
                                                        &bull; Recreational / Non-Rx Drugs: <strong>{{ $sub['drugs'] ?? 'No' }}</strong>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Page 2 Content: Starts on Page 2 with Repeating Header -->
                            <div class="page-2-wrapper">
                                <!-- 05 / Initial Visit Questionnaire & Appointment Details -->
                                <div class="section">
                                    <div class="section-header">05 / Initial Visit Questionnaire & Appointment Details</div>
                                    <table class="grid">
                                        <tr>
                                            <th>Counseling Type / Venue</th>
                                            <td><strong>FACE-TO-FACE (SWEU GUIDANCE OFFICE)</strong></td>
                                            <th>Appointment Schedule</th>
                                            <td>{{ $appointment->scheduled_date ?? 'To be scheduled' }} at {{ $appointment->scheduled_time ?? '' }}</td>
                                        </tr>
                                        <tr>
                                            <th>Assigned Counselor</th>
                                            <td>{{ $counselor ? $counselor->full_name . ' (' . ($counselor->designation ?? 'Counselor') . ')' : 'Pending SWEU Staff Assignment' }}</td>
                                            <th>Appointment Status</th>
                                            <td><strong>{{ strtoupper(str_replace('_', ' ', $appointment->status ?? 'pending')) }}</strong></td>
                                        </tr>
                                        <tr>
                                            <th>Reason for Initial Visit</th>
                                            <td colspan="3">{{ $q['reason'] ?? 'Not specified' }}</td>
                                        </tr>
                                        <tr>
                                            <th>Session Expectations</th>
                                            <td colspan="3">{{ $q['expectations'] ?? 'Not specified' }}</td>
                                        </tr>
                                        <tr>
                                            <th>Average Sleep per Night</th>
                                            <td>{{ $q['average_sleep'] ?? 'Not specified' }}</td>
                                            <th>Prior Mental Health Consultation</th>
                                            <td>
                                                @if(!empty($q['prior_consultation']))
                                                    <span class="badge badge-yes">YES</span>
                                                    @if(!empty($q['prior_consultation_details']))
                                                        <br><small>{{ $q['prior_consultation_details'] }}</small>
                                                    @endif
                                                @else
                                                    <span class="badge badge-no">NO</span>
                                                @endif
                                            </td>
                                        </tr>
                                        @if(!empty($q['additional_comments']))
                                        <tr>
                                            <th>Additional Notes / Concerns</th>
                                            <td colspan="3">{{ $q['additional_comments'] }}</td>
                                        </tr>
                                        @endif
                                        @if(!empty($appointment->onboarding_note))
                                        <tr>
                                            <th>Counselor Onboarding Note</th>
                                            <td colspan="3" style="color: #0f4c3a; font-weight: 500;">{{ $appointment->onboarding_note }}</td>
                                        </tr>
                                        @endif
                                    </table>
                                </div>

                                <!-- Anchored to the very bottom of the last page -->
                                <div class="last-page-bottom-block">
                                    <!-- Sworn Verification Statement -->
                                    <div class="declaration-box">
                                        <strong>Sworn Truthfulness Statement:</strong><br>
                                        "This signature indicates that all information provided in this intake form is truthful, accurate, and complete to the best of my knowledge. I authorize BukSU SWEU Guidance and Counseling Services to handle this record under strict ethical confidentiality standards."
                                    </div>

                                    <!-- Signature Block -->
                                    <div class="signature-block">
                                        @php
                                            $sigVal = is_array($appointment->signature) ? ($appointment->signature['data'] ?? '') : (is_string($appointment->signature) ? $appointment->signature : '');
                                            $studentNameParts = array_filter([
                                                $personal['first_name'] ?? '',
                                                $personal['middle_name'] ?? '',
                                                $personal['last_name'] ?? '',
                                            ]);
                                            $fullNameDisplay = !empty($studentNameParts) ? implode(' ', $studentNameParts) : ($user->full_name ?? 'CLIENT NAME');
                                        @endphp
                                        <div class="signature-box">
                                            <div class="signature-line">
                                                @if(!empty($sigVal) && str_starts_with($sigVal, 'data:image'))
                                                    <img src="{{ $sigVal }}" alt="Digital Signature">
                                                @elseif(!empty($sigVal))
                                                    <span class="cursive-text">{{ $sigVal }}</span>
                                                @else
                                                    <span class="cursive-text">{{ $fullNameDisplay }}</span>
                                                @endif
                                            </div>
                                            <div class="signature-caption">
                                                {{ strtoupper($fullNameDisplay) }}<br>
                                                <span style="font-weight: normal; font-size: 7.5pt; color: #64748b;">Client Signature over Printed Name</span>
                                            </div>
                                        </div>

                                        <div class="signature-box">
                                            <div class="signature-line">
                                                <span style="font-size: 9.5pt; font-weight: 600; color: #334155;">
                                                    {{ $appointment->signed_at ? (is_string($appointment->signed_at) ? $appointment->signed_at : $appointment->signed_at->toDateTime()->format('F d, Y h:i A')) : now()->format('F d, Y h:i A') }}
                                                </span>
                                            </div>
                                            <div class="signature-caption">
                                                DATE & SUBMISSION TIMESTAMP
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Document Footer -->
                                    <div class="footer">
                                        <span>Bukidnon State University • Student Welfare and Education Unit (SWEU)</span>
                                        <span>Guidance and Counseling Services</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
