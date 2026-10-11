import { redirect } from 'next/navigation';

export default function CuteRegisterPage() {
  redirect('/sandbox/cutelogin?mode=register');
}