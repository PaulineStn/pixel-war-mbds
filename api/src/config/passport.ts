import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  getUserByEmailWithPassword,
  getUserById,
  verifyPassword,
} from "../services/auth.service";

let isPassportConfigured = false;

type SessionUser = {
  _id: string;
  username: string;
  email: string;
};

export const configurePassport = () => {
  if (isPassportConfigured) {
    return passport;
  }

  passport.use(
    "local",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const normalizedEmail = email.trim().toLowerCase();

          const user = await getUserByEmailWithPassword(normalizedEmail);

          if (!user || !user.password) {
            done(null, false, { message: "Identifiants invalides." });
            return;
          }

          const isValid = await verifyPassword(password, user.password);

          if (!isValid) {
            done(null, false, { message: "Identifiants invalides." });
            return;
          }

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    const authUser = user as SessionUser;
    done(null, authUser._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await getUserById(id);

      if (!user) {
        done(null, false);
        return;
      }

      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  });

  isPassportConfigured = true;
  return passport;
};