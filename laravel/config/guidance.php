<?php

return [
    'student_id_pattern' => env('STUDENT_ID_PATTERN', '/^[A-Za-z0-9][A-Za-z0-9-]{3,19}$/'),
    'agreement_version' => '2026-01',
    'roles' => ['student', 'faculty', 'staff', 'counselor', 'head_counselor', 'admin'],
    // Permission grants can narrow a role's functions, never expand its clinical scope.
    'permissions' => [
        'student' => ['intake.manage', 'appointments.book', 'referrals.submit', 'testing.request'],
        'faculty' => ['referrals.submit'],
        'staff' => ['queue.manage', 'referrals.manage', 'testing.manage', 'reports.view'],
        'counselor' => ['appointments.manage', 'notes.manage'],
        'head_counselor' => ['notes.audit.read'],
        'admin' => ['users.manage', 'roles.manage'],
    ],
    'colleges' => [
        ['code' => 'COT', 'name' => 'College of Technologies'],
        ['code' => 'CAS', 'name' => 'College of Arts and Sciences'],
        ['code' => 'COBA', 'name' => 'College of Business Administration'],
        ['code' => 'COE', 'name' => 'College of Education'],
        ['code' => 'CON', 'name' => 'College of Nursing'],
        ['code' => 'COL', 'name' => 'College of Law'],
        ['code' => 'COM', 'name' => 'College of Medicine'],
        ['code' => 'CPAG', 'name' => 'College of Public Administration and Governance'],
    ],
    'programs' => [
        'COT' => [
            'Bachelor of Science in Information Technology (BSIT)',
            'Bachelor of Science in Automotive Technology (BSAT)',
            'Bachelor of Science in Electronics Technology (BSET)',
            'Bachelor of Science in Food Technology (BSFT)',
            'Bachelor of Entertainment and Multimedia Computing (BEMC)',
        ],
        'CAS' => [
            'Bachelor of Arts in English Language (BAEL)',
            'Bachelor of Arts in Philosophy (BAPhil)',
            'Bachelor of Arts in Sociology (BASoc)',
            'Bachelor of Science in Development Communication (BSDevCom)',
            'Bachelor of Science in Biology (BSBio)',
            'Bachelor of Science in Mathematics (BSMath)',
            'Bachelor of Science in Environmental Science (BSES)',
            'Bachelor of Science in Community Development (BSCD)',
        ],
        'COBA' => [
            'Bachelor of Science in Business Administration - Financial Management (BSBA-FM)',
            'Bachelor of Science in Business Administration - Marketing Management (BSBA-MM)',
            'Bachelor of Science in Business Administration - Human Resource Management (BSBA-HRM)',
            'Bachelor of Science in Hospitality Management (BSHM)',
            'Bachelor of Science in Accountancy (BSA)',
        ],
        'COE' => [
            'Bachelor of Elementary Education (BEEd)',
            'Bachelor of Secondary Education - Major in English (BSEd-English)',
            'Bachelor of Secondary Education - Major in Mathematics (BSEd-Math)',
            'Bachelor of Secondary Education - Major in Science (BSEd-Science)',
            'Bachelor of Secondary Education - Major in Filipino (BSEd-Filipino)',
            'Bachelor of Secondary Education - Major in Social Studies (BSEd-Social Studies)',
            'Bachelor of Early Childhood Education (BECEd)',
            'Bachelor of Physical Education (BPEd)',
        ],
        'CON' => [
            'Bachelor of Science in Nursing (BSN)',
        ],
        'COL' => [
            'Juris Doctor (JD)',
        ],
        'COM' => [
            'Doctor of Medicine (MD)',
        ],
        'CPAG' => [
            'Bachelor of Public Administration (BPA)',
        ],
    ],
];
