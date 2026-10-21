<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function profile(Request $request)
    {
        $data = $request->validate(['full_name' => ['required', 'string', 'max:150']]);
        $request->user()->update($data);

        return back()->with('success', 'Your profile has been updated.');
    }

    public function preferences(Request $request)
    {
        $data = $request->validate(['notification_refresh' => ['required', 'boolean']]);
        $request->user()->update(['preferences' => array_replace($request->user()->preferences ?? [], $data)]);

        return back()->with('success', 'Your preferences have been saved.');
    }
}
