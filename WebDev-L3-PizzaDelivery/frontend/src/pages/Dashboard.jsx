import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";

const STEPS = [
  { key: "base", title: "Step 1: Choose a pizza base", multi: false },
  { key: "sauce", title: "Step 2: Choose a sauce", multi: false },
  { key: "cheese", title: "Step 3: Choose a cheese", multi: false },
  { key: "veggie", title: "Step 4: Choose vegetables (one or more)", multi: true },
];
const STAGES = ["Order Received", "In Kitchen", "Sent to Delivery"];

export default function Dashboard() {
  const { session } = useAuth();
  const token = session.token;
  const [menu, setMenu] = useState(null);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [msg, setMsg] = useState("");

  const loadOrders = () => api("/orders/mine", { token }).then(setOrders).catch(() => {});
  useEffect(() => {
    api("/menu", { token }).then(setMenu).catch((e) => setMsg(e.message));
    loadOrders();
    const t = setInterval(loadOrders, 5000);       // polling: status changes appear within seconds
    return () => clearInterval(t);
  }, []);

  async function pay() {
    setMsg("");
    try {
      if (!window.Razorpay) throw new Error("Razorpay could not load. Check your internet connection.");
      const c = await api("/orders/checkout", { method: "POST", token, body: summary.payload });
      const rzp = new window.Razorpay({
        key: c.keyId, amount: c.amount, currency: "INR", name: "Pizza Delivery",
        description: summary.title, order_id: c.razorpayOrderId,
        prefill: { name: session.name },
        handler: async (r) => {
          try {
            await api("/orders/verify", { method: "POST", token, body: { orderId: c.orderId, ...r } });
            setMsg("Payment successful! Your order is confirmed.");
            setSummary(null); loadOrders();
          } catch (e) { setMsg(e.message); }
        },
        modal: { ondismiss: () => setMsg("Payment cancelled. No money was taken.") },
      });
      rzp.open();
    } catch (e) { setMsg(e.message); }
  }

  if (!menu) return <p>{msg || "Loading menu..."}</p>;

  return (
    <>
      {msg && <p className="notice" role="status">{msg}</p>}

      {summary ? <Summary s={summary} pay={pay} cancel={() => setSummary(null)} /> : (
        <>
          <h2>Our pizzas</h2>
          <div className="grid">
            {menu.varieties.map((v) => (
              <article className="card" key={v._id}>
                <h3>{v.name}</h3>
                <p>{v.description}</p>
                <p className="small">{v.base}, {v.sauce}, {v.cheese}, {v.veggies.join(", ")}</p>
                <p><strong>&#8377;{v.price}</strong></p>
                <button onClick={() => setSummary({
                  title: v.name, total: v.price, payload: { type: "variety", varietyId: v._id },
                  lines: [["Base", v.base], ["Sauce", v.sauce], ["Cheese", v.cheese], ["Vegetables", v.veggies.join(", ")]],
                })}>Order</button>
              </article>
            ))}
          </div>
          <Builder menu={menu} onReview={setSummary} />
        </>
      )}

      <h2>My orders</h2>
      {orders.length === 0 && <p className="small">No orders yet.</p>}
      {orders.map((o) => <OrderCard key={o._id} o={o} />)}
    </>
  );
}

function Builder({ menu, onReview }) {
  const [step, setStep] = useState(0);
  const [pick, setPick] = useState({ base: "", sauce: "", cheese: "", veggie: [] });
  const s = STEPS[step];
  const price = (cat, name) => menu.options[cat].find((o) => o.name === name)?.price || 0;
  const ready = s.multi ? pick.veggie.length > 0 : !!pick[s.key];

  function choose(name) {
    if (s.multi) {
      const has = pick.veggie.includes(name);
      setPick({ ...pick, veggie: has ? pick.veggie.filter((v) => v !== name) : [...pick.veggie, name] });
    } else setPick({ ...pick, [s.key]: name });
  }
  function review() {
    const total = price("base", pick.base) + price("sauce", pick.sauce) + price("cheese", pick.cheese)
      + pick.veggie.reduce((t, v) => t + price("veggie", v), 0);
    onReview({
      title: "Custom Pizza", total,
      payload: { type: "custom", base: pick.base, sauce: pick.sauce, cheese: pick.cheese, veggies: pick.veggie },
      lines: [["Base", pick.base], ["Sauce", pick.sauce], ["Cheese", pick.cheese], ["Vegetables", pick.veggie.join(", ")]],
    });
  }

  return (
    <section className="card">
      <h2>Build your own pizza</h2>
      <p className="small">{s.title} ({step + 1} of 4)</p>
      <div className="options">
        {menu.options[s.key].map((o) => {
          const checked = s.multi ? pick.veggie.includes(o.name) : pick[s.key] === o.name;
          return (
            <label key={o.name} className={"opt" + (checked ? " on" : "") + (o.available ? "" : " off")}>
              <input type={s.multi ? "checkbox" : "radio"} name={s.key} checked={checked}
                disabled={!o.available} onChange={() => choose(o.name)} />
              {o.name} (&#8377;{o.price}){!o.available && " - out of stock"}
            </label>
          );
        })}
      </div>
      <div className="row">
        <button className="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
        {step < 3
          ? <button disabled={!ready} onClick={() => setStep(step + 1)}>Next</button>
          : <button disabled={!ready} onClick={review}>Review order</button>}
      </div>
    </section>
  );
}

function Summary({ s, pay, cancel }) {
  return (
    <section className="card narrow">
      <h2>Order summary</h2>
      <h3>{s.title}</h3>
      <ul className="plain">{s.lines.map(([k, v]) => <li key={k}><strong>{k}:</strong> {v}</li>)}</ul>
      <p className="total">Total: &#8377;{s.total}</p>
      <p className="small">Test mode: in the Razorpay window choose a test method and click "Success".</p>
      <div className="row">
        <button onClick={pay}>Pay with Razorpay</button>
        <button className="ghost" onClick={cancel}>Cancel</button>
      </div>
    </section>
  );
}

function OrderCard({ o }) {
  const at = STAGES.indexOf(o.status);
  return (
    <article className="card">
      <strong>{o.pizza.name}</strong> - &#8377;{o.total}
      <p className="small">{o.pizza.base}, {o.pizza.sauce}, {o.pizza.cheese}, {o.pizza.veggies.join(", ")}</p>
      <div className="track">
        {STAGES.map((st, i) => <span key={st} className={i <= at ? "step on" : "step"}>{st}</span>)}
      </div>
    </article>
  );
}
