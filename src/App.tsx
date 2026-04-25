import { useEffect, useMemo, useState } from "react";
import "./App.css";

type TripForm = {
  people: number | "";
  tripDays: number | "";
  transportDaily: number | "";
  mealCost: number | "";
  mealsPerDay: number | "";
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

const defaultValues: TripForm = {
  people: 1,
  tripDays: 7,
  transportDaily: 12,
  mealCost: 18,
  mealsPerDay: 3,
  lodgingBrl: "",
  flightBrl: "",
  tickets: 160,
  shopping: 220,
  usdAmount: 1800,
};

const formatCurrency = (value: number, currency: "GBP" | "USD" | "BRL") =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

function getMonthsUntilNovember() {
  const now = new Date();
  const targetMonth = 10;
  let targetYear = now.getFullYear();

  if (now.getMonth() > targetMonth) {
    targetYear += 1;
  }

  const monthsRemaining =
    (targetYear - now.getFullYear()) * 12 + (targetMonth - now.getMonth()) + 1;

  return {
    monthsRemaining: Math.max(1, monthsRemaining),
    targetYear,
  };
}

const toNumber = (value: number | "", fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

function App() {
  const [form, setForm] = useState<TripForm>(defaultValues);
  const [gbpToUsdRate, setGbpToUsdRate] = useState<number | null>(null);
  const [gbpToBrlRate, setGbpToBrlRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        setRateError(null);
        const response = await fetch(
          "https://api.frankfurter.app/latest?from=GBP&to=USD,BRL",
          {
            headers: { Accept: "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar cotação");
        }

        const data = (await response.json()) as { date?: string; rates?: { USD?: number; BRL?: number } };
        const usdRate = data.rates?.USD;
        const brlRate = data.rates?.BRL;

        if (!usdRate || !brlRate) {
          throw new Error("Cotação inválida");
        }

        setGbpToUsdRate(usdRate);
        setGbpToBrlRate(brlRate);
        setRateDate(data.date ?? null);
      } catch {
        setGbpToUsdRate(1.28);
        setGbpToBrlRate(7.35);
        setRateDate(null);
        setRateError("Não foi possível carregar cotação ao vivo; usando taxa de segurança.");
      }
    };

    void loadExchangeRate();
  }, []);

  const monthsInfo = useMemo(() => getMonthsUntilNovember(), []);

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
    const brlFixedTotalInGbp = gbpToBrlRate ? brlFixedTotal / gbpToBrlRate : 0;
    const totalCost = transportTotal + foodTotal + extrasTotal + brlFixedTotalInGbp;
    const flightInGbp = gbpToBrlRate ? flightBrl / gbpToBrlRate : 0;
    const lodgingInGbp = gbpToBrlRate ? lodgingBrl / gbpToBrlRate : 0;

    const convertedUsd = gbpToUsdRate ? usdAmount / gbpToUsdRate : 0;
    const amountNeeded = Math.max(0, totalCost - convertedUsd);
    const monthlySavingGbp = amountNeeded / monthsInfo.monthsRemaining;
    const monthlySavingBrl = monthlySavingGbp * (gbpToBrlRate ?? 0);
    const monthlySavingUsd = monthlySavingGbp * (gbpToUsdRate ?? 0);

    return {
      transportTotal,
      foodTotal,
      ticketsTotal,
      shoppingTotal,
      flightInGbp,
      lodgingInGbp,
      totalCost,
      convertedUsd,
      amountNeeded,
      monthlySavingGbp,
      monthlySavingBrl,
      monthlySavingUsd,
    };
  }, [form, gbpToBrlRate, gbpToUsdRate, monthsInfo.monthsRemaining]);

  const totalsInBrlAndUsd = useMemo(() => {
    const gbpToBrl = gbpToBrlRate ?? 0;
    const gbpToUsd = gbpToUsdRate ?? 0;

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
        label: "Passagem",
        gbp: totals.flightInGbp,
        brl: totals.flightInGbp * gbpToBrl,
        usd: totals.flightInGbp * gbpToUsd,
      },
      {
        label: "Hospedagem",
        gbp: totals.lodgingInGbp,
        brl: totals.lodgingInGbp * gbpToBrl,
        usd: totals.lodgingInGbp * gbpToUsd,
      },
      {
        label: "Custo total da viagem",
        gbp: totals.totalCost,
        brl: totals.totalCost * gbpToBrl,
        usd: totals.totalCost * gbpToUsd,
      },
      {
        label: "USD convertido para GBP",
        gbp: totals.convertedUsd,
        brl: totals.convertedUsd * gbpToBrl,
        usd: totals.convertedUsd * gbpToUsd,
      },
      {
        label: "Valor ainda necessário",
        gbp: totals.amountNeeded,
        brl: totals.amountNeeded * gbpToBrl,
        usd: totals.amountNeeded * gbpToUsd,
      },
      {
        label: "Poupança mensal",
        gbp: totals.monthlySavingGbp,
        brl: totals.monthlySavingBrl,
        usd: totals.monthlySavingUsd,
      },
    ];
  }, [gbpToBrlRate, gbpToUsdRate, totals]);

  const totalCostBrl = totals.totalCost * (gbpToBrlRate ?? 0);
  const totalCostUsd = totals.totalCost * (gbpToUsdRate ?? 0);
  const amountNeededBrl = totals.amountNeeded * (gbpToBrlRate ?? 0);
  const amountNeededUsd = totals.amountNeeded * (gbpToUsdRate ?? 0);

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
      [key]: key === "people" ? Math.floor(Math.max(1, parsed)) : parsed,
    }));
  };

  const onInputBlur = (key: keyof TripForm) => {
    setForm((current) => {
      if (current[key] !== "") return current;
      return { ...current, [key]: key === "people" ? 1 : 0 };
    });
  };

  const monthsLabel = monthsInfo.monthsRemaining === 1 ? "mês" : "meses";

  return (
    <main className="app-shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />

      <header className="hero">
        <p className="eyebrow">Planejamento de Viagem</p>
        <h1>Help My Trip!</h1>
        <p className="subtitle">
          Estime custos diários, converta USD para GBP na cotação atual e descubra quanto
          precisa poupar por mês.
        </p>
      </header>

      <section className="panel grid">
        <div className="card">
          <h2>Dados da viagem</h2>
          <div className="form-grid">
            <Field label="Pessoas" value={form.people} onChange={(v) => onInputChange("people", v)} onBlur={() => onInputBlur("people")} step={1} min={1} />
            <Field label="Dias da viagem" value={form.tripDays} onChange={(v) => onInputChange("tripDays", v)} onBlur={() => onInputBlur("tripDays")} step={1} />
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
            {rateError
              ? `${rateError} Taxas usadas: 1 GBP = ${formatCurrency(gbpToUsdRate ?? 0, "USD")} e ${formatCurrency(
                  gbpToBrlRate ?? 0,
                  "BRL"
                )}.`
              : gbpToUsdRate && gbpToBrlRate
              ? `Cotação atual: 1 GBP = ${formatCurrency(gbpToUsdRate, "USD")} e ${formatCurrency(gbpToBrlRate, "BRL")}${
                  rateDate ? ` (Frankfurter, ${rateDate})` : ""
                }`
              : "Carregando cotações GBP → USD/BRL..."}
          </p>

          <div className="kpis">
            <article>
              <p>Custo total da viagem</p>
              <strong>{formatCurrency(totals.totalCost, "GBP")}</strong>
              <p className="kpi-sub">{`≈ ${formatCurrency(totalCostBrl, "BRL")} | ${formatCurrency(totalCostUsd, "USD")}`}</p>
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
              <p className="kpi-sub">{`≈ ${formatCurrency(amountNeededBrl, "BRL")} | ${formatCurrency(amountNeededUsd, "USD")}`}</p>
            </article>
            <article>
              <p>Poupança mensal até novembro</p>
              <strong className={totals.amountNeeded > 0 ? "positive" : "neutral"}>{formatCurrency(totals.monthlySavingBrl, "BRL")}</strong>
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
              ? `Você tem ${monthsInfo.monthsRemaining} ${monthsLabel} até ${monthNames[10]} de ${monthsInfo.targetYear} para atingir a meta.`
              : `Com o valor convertido de USD, sua meta até ${monthNames[10]} de ${monthsInfo.targetYear} já está coberta.`}
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
          event.preventDefault();
        }}
      />
    </label>
  );
}

export default App;
