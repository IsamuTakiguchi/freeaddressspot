import { signOutAction } from "@/app/login/actions";

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="press sheen glass-thin rounded-full px-3.5 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-300"
      >
        ログアウト
      </button>
    </form>
  );
}
