const express = require('express');
const authMiddleware = require('../middlewares/auth');
const cors = require('cors');
const routes = express.Router();

const HomeController = require('../controllers/HomeController');
const LoginController = require('../controllers/LoginController');
const RegisterController = require('../controllers/RegisterController');
const ArticlesController = require('../controllers/ArticlesController');
const ProfileController = require('../controllers/ProfileController');
const HallController = require('../controllers/HallController');
const StaffController = require('../controllers/StaffController');
const ShopController = require('../controllers/ShopController');
const SettingsController = require('../controllers/SettingsController');
const RecPasswordController = require('../controllers/RecPasswordController');
const SecurityController = require('../controllers/SecurityController');

routes.use(cors());

//routes.post('/validation', SecurityController.validSignature);


routes.post('/user-register', RegisterController.register);
routes.post('/login-user', LoginController.login);
routes.post('/user_login_pin', LoginController.loginPin);
routes.post('/recovery_account', LoginController.recoverPassword);

routes.post('/check', RegisterController.check);
routes.post('/look', LoginController.look);
routes.post('/send_reset_password', RecPasswordController.resetPassword);
routes.post('/get_reset_key', RecPasswordController.getResetKey);

routes.get('/news-index', ArticlesController.indexNews);
routes.get('/article-index', ArticlesController.getNewsIndex);
routes.get('/news', ArticlesController.getNews);

routes.get('/user_token_id', HomeController.getUserIdFromTokenUrl);
routes.get('/get-like-news', ArticlesController.getLikesFromNewsId);
routes.get('/get-comments-from-news', ArticlesController.getCommentsFromNewsId);
routes.get('/get-users-liked', ArticlesController.getUsersLikedFromNewsId);


routes.post('/save-payment', ShopController.insertPayment);
routes.post('/approved-payment', ShopController.approvedPayment);
routes.post('/rejected-payment', ShopController.rejectedPayment);
routes.post('/cancelled-payment', ShopController.cancelledPayment);

routes.get('/get_photos', HomeController.getPhotos);


routes.use(authMiddleware);

routes.get('/get_user_socialmedia', SettingsController.getUserSocialMedia);

routes.post('/user_settings_update', SettingsController.updateUserSettings);
routes.post('/user_email_update', SettingsController.updateUserEmail);
routes.post('/user_password_update', SettingsController.updateUserPassword);
routes.post('/user_socialmedia', SettingsController.updateUserSocialMedia);


routes.get('/user_settings', SettingsController.getUserSettings);

routes.get('/user-me', HomeController.getUserMe);
routes.get('/richest-users', HomeController.getRichestUsers);
routes.get('/featured-groups', HomeController.getFeaturedGroups);
routes.get('/articles-me', HomeController.getArticlesMe);
routes.get('/articles-slider-text', HomeController.getSliderListNews);
routes.get('/friends-online', HomeController.getOnlineFriends);


routes.get('/profile-user-data', ProfileController.getPlayerDataProfile);
routes.get('/profile-count-data', ProfileController.getCountDataProfile);
routes.get('/profile-favoritegroup', ProfileController.getFavoriteGroup);
routes.get('/profile-badgesused', ProfileController.getBadgesUsed);
routes.get('/profile-allbadges', ProfileController.getAllBadges);
routes.get('/profile-rooms', ProfileController.getAllRooms);
routes.get('/profile-groups', ProfileController.getAllGroups);
routes.get('/profile-errands', ProfileController.getErrandsProfile);

routes.post('/profile/send-errand', ProfileController.sendErrandProfile);

routes.get('/hall/credits', HallController.credits);
routes.get('/hall/diamonds', HallController.diamonds);
routes.get('/hall/duckets', HallController.duckets);
routes.get('/hall/events', HallController.events);
routes.get('/hall/promo', HallController.promotions);

routes.get('/staffs', StaffController.getStaffs);
routes.get('/colabs', StaffController.getColab);


routes.get('/plans-vip', ShopController.getPlansVIP);
routes.get('/plans-stars', ShopController.getPlansStars);
routes.get('/plans-diamonds', ShopController.getPlansDiamonds);
routes.get('/plans-duckets', ShopController.getPlansDuckets);



routes.post('/send-comment', ArticlesController.sendComment);
routes.post('/send-like', ArticlesController.sendLike);




module.exports = routes;