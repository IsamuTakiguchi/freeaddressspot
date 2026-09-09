import { signOutAction } from "@/app/login/actions";

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="press text-sm text-gray-400 hover:text-gray-600 hover:underline dark:text-gray-500 dark:hover:text-gray-300"
      >
        ログアウト
      </button>
    </form>
  );
}
