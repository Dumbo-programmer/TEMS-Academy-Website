import { onRequestPost } from "../../functions/api/apply.js";

export default async function apply(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { allow: "POST" }
    });
  }

  return onRequestPost({
    request,
    env: process.env
  });
}
