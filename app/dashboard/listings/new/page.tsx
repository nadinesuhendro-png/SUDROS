// PATH: app/dashboard/listings/new/page.tsx
// AKSI: UPDATE FILE

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewListingForm from "./NewListingForm";

type Category = {
  id: string;
  name: string;
};

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<Category[]>();

  return (
    <NewListingForm categories={categories || []} errorMessage={params.error} />
  );
}
