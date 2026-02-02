import "dotenv/config";
import App from "./app";
import ArticlesController from "./content/content.controller";
import NewslettersController from "./newsletters/newsletters.controller";
import AuthentificationController from "./authentification/authentification.controller";
import UserController from "./users/user.controller";
import ContactUsController from "./contactUs/contactUs.controller";

const app = new App([
  new ArticlesController(),
  new UserController(),
  new NewslettersController(),
  new AuthentificationController(),
  new ContactUsController()
]);
app.listen();
