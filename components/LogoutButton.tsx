import { signOutAction } from "@/app/login/actions";

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
      >
        ログアウト
      </button>
    </form>
  );
}
