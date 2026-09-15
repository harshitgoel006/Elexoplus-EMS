<?php

use Core\Router;
use Modules\Profile\Controllers\ProfileController;

Router::group('api', function () {
    Router::post('/profile/change-password', [ProfileController::class, 'changePassword']);
});
