import { redirect } from "next/navigation";

export default function Home() {
  // The proxy sends signed-out visitors of /trip to the login page.
  redirect("/trip");
}
