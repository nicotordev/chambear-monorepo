import { env } from "@/config";
import Stripe from "stripe";

export const stripe = new Stripe(env.stripeSecretKey);

export default stripe;
