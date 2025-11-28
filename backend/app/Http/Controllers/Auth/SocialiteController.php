<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class SocialiteController extends Controller
{
    /**
     * Redirect the user to the provider's authentication page.
     */
    public function redirectToProvider($provider)
    {
        $this->validateProvider($provider);
        return Socialite::driver($provider)->stateless()->redirect();
    }

    /**
     * Obtain the user information from the provider.
     */
    public function handleProviderCallback($provider)
    {
        $this->validateProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (Exception $e) {
            // If there's an error (e.g., user cancels), redirect to frontend login with an error
            return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?error=authentication_failed');
        }
        
        // Find or create the user
        $user = User::updateOrCreate(
            ['email' => $socialUser->getEmail()],
            [
                'username' => $socialUser->getNickname() ?? strtok($socialUser->getEmail(), '@') . '_' . Str::random(3),
                'password' => Hash::make(Str::random(24)), // Create a secure random password
                'provider' => $provider,
                'provider_id' => $socialUser->getId(),
            ]
        );

        // Update or create the user's profile
        UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'full_name' => $socialUser->getName(),
                'avatar' => $socialUser->getAvatar(),
            ]
        );

        // Create a token for the user
        $token = $user->createToken('social-login-token')->plainTextToken;
        
        // Redirect to a frontend route that will handle the token
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        return redirect()->away($frontendUrl . '/auth/social-callback?token=' . $token);
    }

    /**
     * Validate that the provider is supported.
     */
    protected function validateProvider($provider)
    {
        if (!in_array($provider, ['facebook', 'google'])) {
            abort(404, 'Provider not supported.');
        }
    }
}
