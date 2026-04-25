import { useEffect, useMemo, useState } from "react";
import "./App.css";

type TripForm = {
  people: number | "";
  tripDays: number | "";
  transportDaily: number | "";
  mealCost: number | "";
  mealsPerDay: number | "";
  tripMonth: number | "";
  tripYear: number | "";
  lodgingBrl: number | "";
  flightBrl: number | "";
  tickets: number | "";
  shopping: number | "";
  usdAmount: number | "";
};

const monthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const getDefaultTripTarget = () => {
  const now = new Date();
  const defaultMonth = 11;
  const defaultYear = now.getMonth() + 1 > defaultMonth ? now.getFullYear() + 1 : now.getFullYear();

  return { defaultMonth, defaultYear };
};

const { defaultMonth, defaultYear } = getDefaultTripTarget();

const defaultValues: TripForm = {
  people: 1,
  tripDays: 7,
  transportDaily: 12,
  mealCost: 18,
  mealsPerDay: 3,
  tripMonth: defaultMonth,
  tripYear: defaultYear,
  lodgingBrl: "",
  flightBrl: "",
  tickets: 160,
  shopping: 220,
  usdAmount: 1800,
};

const STORAGE_KEY = "help-my-trip:form-v1";
const FIXED_GBP_TO_USD = 1.3493;
const FIXED_GBP_TO_BRL = 6.7471;
const FIXED_RATE_DATE = "2026-04-24";

const formatCurrency = (value: number, currency: "GBP" | "USD" | "BRL") =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

const getMonthsUntilTarget = (targetMonth: number, targetYear: number) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const diff = (targetYear - currentYear) * 12 + (targetMonth - currentMonth) + 1;

  return Math.max(1, diff);
};

const toNumber = (value: number | "", fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

function App() {
  const [form, setForm] = useState<TripForm>(defaultValues);
  const [gbpToUsdRate] = useState<number>(FIXED_GBP_TO_USD);
  const [gbpToBrlRate] = useState<number>(FIXED_GBP_TO_BRL);
  const [rateDate] = useState<string>(FIXED_RATE_DATE);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Partial<TripForm>;
      setForm({
        people: typeof parsed.people === "number" || parsed.people === "" ? parsed.people : defaultValues.people,
        tripDays: typeof parsed.tripDays === "number" || parsed.tripDays === "" ? parsed.tripDays : defaultValues.tripDays,
        tripMonth: typeof parsed.tripMonth === "number" || parsed.tripMonth === "" ? parsed.tripMonth : defaultValues.tripMonth,
        tripYear: typeof parsed.tripYear === "number" || parsed.tripYear === "" ? parsed.tripYear : defaultValues.tripYear,
        transportDaily:
          typeof parsed.transportDaily === "number" || parsed.transportDaily === ""
            ? parsed.transportDaily
            : defaultValues.transportDaily,
        mealCost: typeof parsed.mealCost === "number" || parsed.mealCost === "" ? parsed.mealCost : defaultValues.mealCost,
        mealsPerDay:
          typeof parsed.mealsPerDay === "number" || parsed.mealsPerDay === "" ? parsed.mealsPerDay : defaultValues.mealsPerDay,
        lodgingBrl:
          typeof parsed.lodgingBrl === "number" || parsed.lodgingBrl === "" ? parsed.lodgingBrl : defaultValues.lodgingBrl,
        flightBrl:
          typeof parsed.flightBrl === "number" || parsed.flightBrl === "" ? parsed.flightBrl : defaultValues.flightBrl,
        tickets: typeof parsed.tickets === "number" || parsed.tickets === "" ? parsed.tickets : defaultValues.tickets,
        shopping: typeof parsed.shopping === "number" || parsed.shopping === "" ? parsed.shopping : defaultValues.shopping,
        usdAmount: typeof parsed.usdAmount === "number" || parsed.usdAmount === "" ? parsed.usdAmount : defaultValues.usdAmount,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const targetInfo = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const targetMonth = Math.min(12, Math.max(1, Math.floor(toNumber(form.tripMonth, defaultMonth))));
    const targetYear = Math.max(currentYear, Math.floor(toNumber(form.tripYear, defaultYear)));
    const monthsRemaining = getMonthsUntilTarget(targetMonth, targetYear);

    return { targetMonth, targetYear, monthsRemaining };
  }, [form.tripMonth, form.tripYear]);

  const totals = useMemo(() => {
    const people = Math.max(1, Math.floor(toNumber(form.people, 1)));
    const tripDays = toNumber(form.tripDays);
    const transportDaily = toNumber(form.transportDaily);
    const mealCost = toNumber(form.mealCost);
    const mealsPerDay = toNumber(form.mealsPerDay);
    const tickets = toNumber(form.tickets);
    const shopping = toNumber(form.shopping);
    const usdAmount = toNumber(form.usdAmount);
    const flightBrl = toNumber(form.flightBrl);
    const lodgingBrl = toNumber(form.lodgingBrl);

    const transportTotal = transportDaily * tripDays * people;
    const foodTotal = mealCost * mealsPerDay * tripDays * people;
    const extrasTotal = (tickets + shopping) * people;
    const ticketsTotal = tickets * people;
    const shoppingTotal = shopping * people;
    const brlFixedTotal = flightBrl + lodgingBrl;
    const dollarEligibleCost = transportTotal + foodTotal + extrasTotal;
    const dollarEligibleCostBrl = dollarEligibleCost * gbpToBrlRate;
    const flightInGbp = gbpToBrlRate ? flightBrl / gbpToBrlRate : 0;
    const lodgingInGbp = gbpToBrlRate ? lodgingBrl / gbpToBrlRate : 0;

    const convertedUsd = gbpToUsdRate ? usdAmount / gbpToUsdRate : 0;
    const amountNeeded = Math.max(0, dollarEligibleCost - convertedUsd);
    const usdToBrlRate = gbpToBrlRate / gbpToUsdRate;
    const usdPurchaseCostBrl = usdAmount * usdToBrlRate;
    const totalTripCostBrl = brlFixedTotal + dollarEligibleCostBrl + usdPurchaseCostBrl;
    const totalTripCostGbp = gbpToBrlRate ? totalTripCostBrl / gbpToBrlRate : 0;
    const amountNeededBrl = amountNeeded * gbpToBrlRate;
    const totalSavingTargetBrl = brlFixedTotal + usdPurchaseCostBrl + amountNeededBrl;
    const monthlySavingBrl = totalSavingTargetBrl / targetInfo.monthsRemaining;
    const monthlySavingGbp = gbpToBrlRate ? monthlySavingBrl / gbpToBrlRate : 0;
    const monthlySavingUsd = usdToBrlRate ? monthlySavingBrl / usdToBrlRate : 0;

    return {
      transportTotal,
      foodTotal,
      ticketsTotal,
      shoppingTotal,
      flightInGbp,
      lodgingInGbp,
      dollarEligibleCost,
      totalTripCostBrl,
      totalTripCostGbp,
      convertedUsd,
      amountNeeded,
      usdPurchaseCostBrl,
      totalSavingTargetBrl,
      monthlySavingGbp,
      monthlySavingBrl,
      monthlySavingUsd,
    };
  }, [form, gbpToBrlRate, gbpToUsdRate, targetInfo.monthsRemaining]);

  const totalsInBrlAndUsd = useMemo(() => {
    const gbpToBrl = gbpToBrlRate;
    const gbpToUsd = gbpToUsdRate;

    return [
      {
        label: "Transporte",
        gbp: totals.transportTotal,
        brl: totals.transportTotal * gbpToBrl,
        usd: totals.transportTotal * gbpToUsd,
      },
      {
        label: "Alimentação",
        gbp: totals.foodTotal,
        brl: totals.foodTotal * gbpToBrl,
        usd: totals.foodTotal * gbpToUsd,
      },
      {
        label: "Ingressos",
        gbp: totals.ticketsTotal,
        brl: totals.ticketsTotal * gbpToBrl,
        usd: totals.ticketsTotal * gbpToUsd,
      },
      {
        label: "Compras",
        gbp: totals.shoppingTotal,
        brl: totals.shoppingTotal * gbpToBrl,
        usd: totals.shoppingTotal * gbpToUsd,
      },
      {
        label: "Subtotal coberto com dólar (sem hotel/passagem)",
        gbp: totals.dollarEligibleCost,
        brl: totals.dollarEligibleCost * gbpToBrl,
        usd: totals.dollarEligibleCost * gbpToUsd,
      },
      {
        label: "Compra de USD informada",
        gbp: totals.usdPurchaseCostBrl / gbpToBrl,
        brl: totals.usdPurchaseCostBrl,
        usd: toNumber(form.usdAmount),
      },
      {
        label: "USD convertido para GBP",
        gbp: totals.convertedUsd,
        brl: totals.convertedUsd * gbpToBrl,
        usd: totals.convertedUsd * gbpToUsd,
      },
      {
        label: "Valor ainda necessário para dólar",
        gbp: totals.amountNeeded,
        brl: totals.amountNeeded * gbpToBrl,
        usd: totals.amountNeeded * gbpToUsd,
      },
      {
        label: "Passagem",
        gbp: totals.flightInGbp,
        brl: toNumber(form.flightBrl),
        usd: totals.flightInGbp * gbpToUsd,
      },
      {
        label: "Hospedagem",
        gbp: totals.lodgingInGbp,
        brl: toNumber(form.lodgingBrl),
        usd: totals.lodgingInGbp * gbpToUsd,
      },
      {
        label: "Meta total para poupar",
        gbp: totals.totalSavingTargetBrl / gbpToBrl,
        brl: totals.totalSavingTargetBrl,
        usd: totals.totalSavingTargetBrl / (gbpToBrl / gbpToUsd),
      },
      {
        label: "Poupança mensal",
        gbp: totals.monthlySavingGbp,
        brl: totals.monthlySavingBrl,
        usd: totals.monthlySavingUsd,
      },
      {
        label: "Custo total da viagem",
        gbp: totals.totalTripCostGbp,
        brl: totals.totalTripCostBrl,
        usd: totals.totalTripCostGbp * gbpToUsd,
      },
    ];
  }, [form.flightBrl, form.lodgingBrl, gbpToBrlRate, gbpToUsdRate, totals]);

  const totalCostBrl = totals.totalTripCostBrl;
  const totalCostUsd = totals.totalTripCostGbp * gbpToUsdRate;
  const amountNeededBrl = totals.amountNeeded * gbpToBrlRate;
  const amountNeededUsd = totals.amountNeeded * gbpToUsdRate;

  const onInputChange = (key: keyof TripForm, value: string) => {
    if (value === "") {
      setForm((current) => ({ ...current, [key]: "" }));
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      [key]:
        key === "people"
          ? Math.floor(Math.max(1, parsed))
          : key === "tripYear"
          ? Math.floor(Math.max(new Date().getFullYear(), parsed))
          : parsed,
    }));
  };

  const onInputBlur = (key: keyof TripForm) => {
    setForm((current) => {
      if (current[key] !== "") return current;
      return {
        ...current,
        [key]:
          key === "people"
            ? 1
            : key === "tripMonth"
            ? defaultMonth
            : key === "tripYear"
            ? defaultYear
            : 0,
      };
    });
  };

  const monthsLabel = targetInfo.monthsRemaining === 1 ? "mês" : "meses";

  return (
    <main className="app-shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />

      <header className="hero">
        <p className="eyebrow">Planejamento de Viagem</p>
        <h1>Help My Trip!</h1>
        <p className="subtitle">
          Estime custos da viagem, veja o total em BRL e descubra quanto ainda precisa comprar
          em dólar para gastos do dia a dia.
        </p>
      </header>

      <section className="panel grid">
        <div className="card">
          <h2>Dados da viagem</h2>
          <div className="form-grid">
            <Field label="Pessoas" value={form.people} onChange={(v) => onInputChange("people", v)} onBlur={() => onInputBlur("people")} step={1} min={1} />
            <Field label="Dias da viagem" value={form.tripDays} onChange={(v) => onInputChange("tripDays", v)} onBlur={() => onInputBlur("tripDays")} step={1} />
            <MonthField
              label="Mês da viagem"
              value={Math.min(12, Math.max(1, Math.floor(toNumber(form.tripMonth, defaultMonth))))}
              onChange={(value) => setForm((current) => ({ ...current, tripMonth: value }))}
            />
            <Field
              label="Ano da viagem"
              value={form.tripYear}
              onChange={(v) => onInputChange("tripYear", v)}
              onBlur={() => onInputBlur("tripYear")}
              step={1}
              min={new Date().getFullYear()}
            />
            <Field label="Transporte diário (GBP)" value={form.transportDaily} onChange={(v) => onInputChange("transportDaily", v)} onBlur={() => onInputBlur("transportDaily")} />
            <Field label="Alimentação por refeição (GBP)" value={form.mealCost} onChange={(v) => onInputChange("mealCost", v)} onBlur={() => onInputBlur("mealCost")} />
            <Field label="Refeições por dia" value={form.mealsPerDay} onChange={(v) => onInputChange("mealsPerDay", v)} onBlur={() => onInputBlur("mealsPerDay")} step={1} />
            <Field label="Passagem total (BRL)" value={form.flightBrl} onChange={(v) => onInputChange("flightBrl", v)} onBlur={() => onInputBlur("flightBrl")} />
            <Field label="Hospedagem total (BRL)" value={form.lodgingBrl} onChange={(v) => onInputChange("lodgingBrl", v)} onBlur={() => onInputBlur("lodgingBrl")} />
            <Field label="Ingressos (GBP)" value={form.tickets} onChange={(v) => onInputChange("tickets", v)} onBlur={() => onInputBlur("tickets")} />
            <Field label="Compras (GBP)" value={form.shopping} onChange={(v) => onInputChange("shopping", v)} onBlur={() => onInputBlur("shopping")} />
            <Field
              className="span-2"
              label="Valor total que você vai comprar (USD)"
              value={form.usdAmount}
              onChange={(v) => onInputChange("usdAmount", v)}
              onBlur={() => onInputBlur("usdAmount")}
            />
          </div>
        </div>

        <div className="card results">
          <h2>Resumo</h2>
          <p className="rate">
            {`Cotação fixa: 1 GBP = ${formatCurrency(gbpToUsdRate, "USD")} e ${formatCurrency(
              gbpToBrlRate,
              "BRL"
            )} (Frankfurter, ${rateDate}).`}
          </p>

          <div className="kpis">
            <article>
              <p>Custo total da viagem</p>
              <strong>{formatCurrency(totalCostBrl, "BRL")}</strong>
              <p className="kpi-sub">Inclui também o valor informado para compra de USD.</p>
              <p className="kpi-sub">{`≈ ${formatCurrency(totals.totalTripCostGbp, "GBP")} | ${formatCurrency(totalCostUsd, "USD")}`}</p>
            </article>
            <article>
              <p>USD convertido para GBP</p>
              <strong>{formatCurrency(totals.convertedUsd, "GBP")}</strong>
            </article>
            <article>
              <p>Valor ainda necessário</p>
              <strong className={totals.amountNeeded > 0 ? "positive" : "neutral"}>
                {formatCurrency(totals.amountNeeded, "GBP")}
              </strong>
              <p className="kpi-sub">Somente para compras, comida, transporte e ingressos.</p>
              <p className="kpi-sub">{`≈ ${formatCurrency(amountNeededBrl, "BRL")} | ${formatCurrency(amountNeededUsd, "USD")}`}</p>
            </article>
            <article>
              <p>{`Poupança mensal até ${monthNames[targetInfo.targetMonth - 1]} de ${targetInfo.targetYear}`}</p>
              <strong className={totals.amountNeeded > 0 ? "positive" : "neutral"}>{formatCurrency(totals.monthlySavingBrl, "BRL")}</strong>
              <p className="kpi-sub">Inclui passagem, hospedagem, compra de USD e complemento necessário.</p>
              <p className="kpi-sub">
                {`≈ ${formatCurrency(totals.monthlySavingGbp, "GBP")} | ${formatCurrency(totals.monthlySavingUsd, "USD")}`}
              </p>
            </article>
          </div>

          <div className="totals-table-wrap">
            <p className="totals-table-title">Conferência por item (BRL e USD)</p>
            <table className="totals-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>GBP</th>
                  <th>BRL</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                {totalsInBrlAndUsd.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{formatCurrency(row.gbp, "GBP")}</td>
                    <td>{formatCurrency(row.brl, "BRL")}</td>
                    <td>{formatCurrency(row.usd, "USD")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="meta">
            {totals.amountNeeded > 0
              ? `Você tem ${targetInfo.monthsRemaining} ${monthsLabel} até ${monthNames[targetInfo.targetMonth - 1]} de ${targetInfo.targetYear} para atingir a meta.`
              : `Com o valor convertido de USD, sua meta até ${monthNames[targetInfo.targetMonth - 1]} de ${targetInfo.targetYear} já está coberta.`}
          </p>
        </div>
      </section>
    </main>
  );
}

type FieldProps = {
  label: string;
  value: number | "";
  onChange: (value: string) => void;
  onBlur: () => void;
  step?: number;
  min?: number;
  className?: string;
};

function Field({ label, value, onChange, onBlur, step = 0.01, min = 0, className }: FieldProps) {
  return (
    <label className={className}>
      {label}
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onWheel={(event) => {
          event.currentTarget.blur();
        }}
      />
    </label>
  );
}

type MonthFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
};

function MonthField({ label, value, onChange, className }: MonthFieldProps) {
  return (
    <label className={className}>
      {label}
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {monthNames.map((month, index) => (
          <option key={month} value={index + 1}>
            {month}
          </option>
        ))}
      </select>
    </label>
  );
}

export default App;
