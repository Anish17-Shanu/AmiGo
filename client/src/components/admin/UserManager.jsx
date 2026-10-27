import { useState } from "react";
import api, { apiErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { shortDate } from "../../utils/format";

const UserManager = ({ users, currentUserId, onChanged }) => {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState(null);

  const changeRole = async (user, role) => {
    if (role === user.role) return;
    if (
      !window.confirm(
        `Change ${user.name}'s role from ${user.role} to ${role}?`
      )
    ) {
      return;
    }

    setUpdatingId(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/role`, { role });
      toast(`${user.name} is now ${role}`, "success");
      onChanged();
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not update role"), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-display text-xl font-bold">User management</h2>
      <div className="mt-4 space-y-3">
        {users.map((user) => {
          const isSelf = user._id === currentUserId;
          return (
            <div
              key={user._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
            >
              <div>
                <p className="font-semibold text-slate-800">
                  {user.name} {isSelf && <span className="text-xs text-slate-500">(you)</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {user.email} - active {shortDate(user.lastActiveAt)}
                </p>
              </div>

              <select
                value={user.role}
                onChange={(event) => changeRole(user, event.target.value)}
                disabled={isSelf || updatingId === user._id}
                className="input w-auto min-w-[8rem]"
                aria-label={`Role for ${user.name}`}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
          );
        })}
        {!users.length && (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            No users found.
          </p>
        )}
      </div>
    </section>
  );
};

export default UserManager;
