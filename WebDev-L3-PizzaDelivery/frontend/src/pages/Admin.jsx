import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";
import { AuthForm } from "./UserPages.jsx";

const STAGES = ["Order Received", "In Kitchen", "Sent to Delivery"];

export function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  return (
    <AuthForm title="Admin login" submit="Login"
      fields={[{ name: "email", label: "Admin email", type: "email" }, { name: "password", label: "Password", type: "password" }]}
      onSubmit={async (v) => { login(await api("/auth/admin-login", { method: "POST", body: v })); nav("/admin"); }} />
  );
}

export function AdminPanel() {
  const { session } = useAuth();
  const token = session.token;
  const [inv, setInv] = useState([]);
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");
  const fail = (e) => setMsg(e.message);

  const loadInv = () => api("/admin/inventory", { token }).then(setInv).catch(fail);
  const loadOrders = () => api("/admin/orders", { token }).then(setOrders).catch(fail);
  useEffect(() => {
    loadInv(); loadOrders();
    const t = setInterval(() => { loadOrders(); loadInv(); }, 5000);
    return () => clearInterval(t);
  }, []);

  async function saveItem(id, stock, threshold) {
    try { await api("/admin/inventory/" + id, { method: "PATCH", token, body: { stock, threshold } }); setMsg("Saved."); loadInv(); }
    catch (e) { fail(e); }
  }
  async function setStatus(id, status) {
    try { await api(`/admin/orders/${id}/status`, { method: "PATCH", token, body: { status } }); loadOrders(); }
    catch (e) { fail(e); }
  }

  return (
    <>
      {msg && <p className="notice" role="status">{msg}</p>}
      <h2>Inventory</h2>
      <div className="scroll">
        <table>
          <thead><tr><th>Type</th><th>Item</th><th>Stock</th><th>Alert below</th><th></th></tr></thead>
          <tbody>{inv.map((i) => <InvRow key={i._id} item={i} onSave={saveItem} />)}</tbody>
        </table>
      </div>

      <h2>Orders</h2>
      {orders.length === 0 && <p className="small">No orders yet.</p>}
      <div className="scroll">
        {orders.length > 0 && (
          <table>
            <thead><tr><th>Customer</th><th>Pizza</th><th>Total</th><th>Placed</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{o.user?.name}<br /><span className="small">{o.user?.email}</span></td>
                  <td>{o.pizza.name}<br /><span className="small">{o.pizza.base}, {o.pizza.sauce}, {o.pizza.cheese}, {o.pizza.veggies.join(", ")}</span></td>
                  <td>&#8377;{o.total}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>
                    <select value={o.status} onChange={(e) => setStatus(o._id, e.target.value)} aria-label="Order status">
                      {STAGES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function InvRow({ item, onSave }) {
  const [stock, setStock] = useState(item.stock);
  const [threshold, setThreshold] = useState(item.threshold);
  useEffect(() => { setStock(item.stock); setThreshold(item.threshold); }, [item.stock, item.threshold]);
  const low = item.stock < item.threshold;
  return (
    <tr className={low ? "low" : ""}>
      <td>{item.category}</td>
      <td>{item.name}{low && " (LOW)"}</td>
      <td><input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} aria-label={item.name + " stock"} /></td>
      <td><input type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} aria-label={item.name + " threshold"} /></td>
      <td><button onClick={() => onSave(item._id, stock, threshold)}>Save</button></td>
    </tr>
  );
}
