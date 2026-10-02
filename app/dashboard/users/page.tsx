import { getUsers } from "@/actions/users";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const users = await getUsers();
  const serialized = users.map((u: typeof users[0]) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }));
  return <UsersClient users={serialized} />;
}
