<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\Api\AcademicProgramController;
use App\Http\Controllers\Api\PsgcController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\IntakeFormController;
use App\Http\Controllers\PersonalInformationController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SessionNoteController;
use App\Http\Controllers\StudentDashboardController;
use App\Http\Controllers\TestingRequestController;
use App\Http\Controllers\WalkInQueueController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect()->route(auth()->check() ? 'dashboard' : 'login'));
Route::middleware(['auth', 'auth.session'])->group(function () {
    Route::get('/dashboard', fn () => redirect()->route(match (auth()->user()->role) {
        'student' => 'student.dashboard', 'faculty' => 'referrals.index', 'staff' => 'queue.index',
        'counselor' => 'counselor.dashboard', 'admin' => 'admin.index', default => abort(403),
    }))->name('dashboard');
    Route::get('/account', fn () => Inertia::render('Account'))->name('account');
    Route::patch('/account/profile', [AccountController::class, 'profile'])->name('account.profile');
    Route::patch('/account/preferences', [AccountController::class, 'preferences'])->name('account.preferences');
    Route::get('/alerts', [AlertController::class, 'index'])->name('alerts.index');
    Route::patch('/alerts/{alert}', [AlertController::class, 'update'])->name('alerts.update');
    Route::get('/notifications', fn () => redirect()->route('alerts.index'))->name('notifications.index');

    Route::get('/api/programs', [AcademicProgramController::class, 'index'])->name('api.programs.index');
    Route::get('/api/psgc/provinces', [PsgcController::class, 'provinces'])->name('api.psgc.provinces');
    Route::get('/api/psgc/cities-municipalities', [PsgcController::class, 'citiesMunicipalities'])->name('api.psgc.cities');
    Route::get('/api/psgc/barangays', [PsgcController::class, 'barangays'])->name('api.psgc.barangays');

    Route::middleware('role:student')->group(function () {
        Route::get('/student/dashboard', StudentDashboardController::class)->name('student.dashboard');
        Route::get('/personal-information', [PersonalInformationController::class, 'edit'])->middleware('permission:intake.manage')->name('personal-information.edit');
        Route::post('/personal-information', [PersonalInformationController::class, 'store'])->middleware('permission:intake.manage')->name('personal-information.store');
        Route::get('/intake', [PersonalInformationController::class, 'edit'])->middleware('permission:intake.manage')->name('intake.edit');
        Route::post('/intake', [PersonalInformationController::class, 'store'])->middleware('permission:intake.manage')->name('intake.store');
        Route::get('/appointments', [AppointmentController::class, 'index'])->middleware('permission:appointments.book')->name('appointments.index');
        Route::get('/appointments/request', [AppointmentController::class, 'wizard'])->middleware('permission:appointments.book')->name('appointments.request');
        Route::post('/appointments', [AppointmentController::class, 'store'])->middleware(['permission:appointments.book', 'throttle:10,1'])->name('appointments.store');
        Route::post('/walk-in', [AppointmentController::class, 'walkIn'])->middleware(['permission:appointments.book', 'throttle:2,1'])->name('walkin.join');
    });
    Route::middleware('role:student|faculty|staff')->group(function () {
        Route::post('/testing', [TestingRequestController::class, 'store'])->middleware(['permission:testing.request|testing.manage', 'throttle:10,1'])->name('testing.store');
    });
    Route::middleware('role:student|faculty')->group(function () {
        Route::post('/referrals', [ReferralController::class, 'store'])->middleware(['permission:referrals.submit', 'throttle:5,1'])->name('referrals.store');
    });
    Route::get('/referrals', [ReferralController::class, 'index'])->middleware(['role:student|faculty|staff', 'permission:referrals.submit|referrals.manage'])->name('referrals.index');
    Route::get('/testing', [TestingRequestController::class, 'index'])->middleware(['role:student|faculty|staff', 'permission:testing.request|testing.manage'])->name('testing.index');
    Route::get('/appointments/{appointment}/pdf', [AppointmentController::class, 'exportPdf'])->name('appointments.pdf');
    Route::middleware('role:staff')->group(function () {
        Route::get('/queue', [WalkInQueueController::class, 'index'])->middleware('permission:queue.manage')->name('queue.index');
        Route::post('/queue', [WalkInQueueController::class, 'store'])->middleware(['permission:queue.manage', 'throttle:10,1'])->name('queue.store');
        Route::patch('/referrals/{referral}', [ReferralController::class, 'update'])->middleware('permission:referrals.manage')->name('referrals.update');
        Route::patch('/testing/{testing}', [TestingRequestController::class, 'update'])->middleware('permission:testing.manage')->name('testing.update');
        Route::get('/reports', [ReportController::class, 'index'])->middleware('permission:reports.view')->name('reports.index');
    });
    Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update'])->middleware(['role:student|staff|counselor'])->name('appointments.update');
    Route::middleware('role:counselor')->group(function () {
        Route::get('/counselor', [SessionNoteController::class, 'dashboard'])->middleware('permission:appointments.manage')->name('counselor.dashboard');
        Route::get('/counselor/appointments/{appointment}/notes', [SessionNoteController::class, 'show'])->middleware('permission:notes.manage')->name('notes.show');
        Route::put('/counselor/appointments/{appointment}/notes', [SessionNoteController::class, 'store'])->middleware('permission:notes.manage')->name('notes.store');
        Route::patch('/availability', [AdminController::class, 'availability'])->name('availability.update');
    });
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin', [AdminController::class, 'index'])->middleware('permission:users.manage')->name('admin.index');
        Route::post('/admin/users', [AdminController::class, 'store'])->middleware('permission:users.manage')->name('admin.store');
        Route::patch('/admin/users/{user}', [AdminController::class, 'update'])->middleware('permission:users.manage')->name('admin.update');
        Route::patch('/admin/roles/{role}', [AdminController::class, 'permissions'])->middleware('permission:roles.manage')->name('admin.permissions');
    });
});
require __DIR__.'/auth.php';
