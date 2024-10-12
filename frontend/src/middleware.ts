import { withAuthMiddlware } from "./middlewares/withAuthMiddleware";
import { withOnboardMiddlware } from "./middlewares/withOnboardMiddleware";
import { chain } from "./middlewares/chain";

export default chain([withAuthMiddlware, withOnboardMiddlware]);

// Define routes that should use the middleware
export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
};
