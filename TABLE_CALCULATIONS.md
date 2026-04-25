# Cálculos da Tabela (Help My Trip)

Este documento descreve de onde vem cada valor mostrado na tabela **"Conferência por item (BRL e USD)"** da aplicação.

Referência de implementação: `src/App.tsx`.

## 1) Entradas usadas nos cálculos

Campos do formulário:

- `people`
- `tripDays`
- `tripMonth`
- `tripYear`
- `transportDaily` (GBP)
- `mealCost` (GBP)
- `mealsPerDay`
- `flightBrl` (BRL)
- `lodgingBrl` (BRL)
- `tickets` (GBP)
- `shopping` (GBP)
- `usdAmount` (USD)

Taxas de câmbio fixas (atualmente no código):

- `GBP -> USD = 1.3493`
- `GBP -> BRL = 6.7471`
- Data de referência: `2026-04-24` (Frankfurter)

## 2) Cálculos-base

- `transportTotal = transportDaily * tripDays * people`
- `foodTotal = mealCost * mealsPerDay * tripDays * people`
- `ticketsTotal = tickets * people`
- `shoppingTotal = shopping * people`

Subtotal que deve ser coberto por dólar (sem hotel/passagem):

- `dollarEligibleCost = transportTotal + foodTotal + ticketsTotal + shoppingTotal` (GBP)

Valores fixos em BRL:

- `brlFixedTotal = flightBrl + lodgingBrl`

Conversões:

- `usdToBrlRate = (gbpToBrlRate / gbpToUsdRate)`
- `usdPurchaseCostBrl = usdAmount * usdToBrlRate`
- `convertedUsd = usdAmount / gbpToUsdRate` (USD convertido para GBP)

Valor ainda necessário para dólar:

- `amountNeeded = max(0, dollarEligibleCost - convertedUsd)` (GBP)

## 3) Custo total da viagem

O custo total exibido hoje inclui:

1. Hotel + passagem (BRL)
2. Custos variáveis da viagem (transportes/comida/ingressos/compras) convertidos para BRL
3. Valor da compra de USD informada convertido para BRL

Fórmula:

- `dollarEligibleCostBrl = dollarEligibleCost * gbpToBrlRate`
- `totalTripCostBrl = brlFixedTotal + dollarEligibleCostBrl + usdPurchaseCostBrl`
- `totalTripCostGbp = totalTripCostBrl / gbpToBrlRate`

## 4) Meta de poupança mensal

Meses até o objetivo (mês/ano informados):

- `monthsRemaining = max(1, (tripYear - currentYear) * 12 + (tripMonth - currentMonth) + 1)`

Meta total para poupar:

- `amountNeededBrl = amountNeeded * gbpToBrlRate`
- `totalSavingTargetBrl = brlFixedTotal + usdPurchaseCostBrl + amountNeededBrl`

Poupança mensal:

- `monthlySavingBrl = totalSavingTargetBrl / monthsRemaining`
- `monthlySavingGbp = monthlySavingBrl / gbpToBrlRate`
- `monthlySavingUsd = monthlySavingBrl / usdToBrlRate`

## 5) Origem de cada linha da tabela

Ordem atual da tabela e de onde vem cada linha:

1. **Transporte**
- GBP: `transportTotal`
- BRL: `transportTotal * gbpToBrlRate`
- USD: `transportTotal * gbpToUsdRate`

2. **Alimentação**
- GBP: `foodTotal`
- BRL: `foodTotal * gbpToBrlRate`
- USD: `foodTotal * gbpToUsdRate`

3. **Ingressos**
- GBP: `ticketsTotal`
- BRL: `ticketsTotal * gbpToBrlRate`
- USD: `ticketsTotal * gbpToUsdRate`

4. **Compras**
- GBP: `shoppingTotal`
- BRL: `shoppingTotal * gbpToBrlRate`
- USD: `shoppingTotal * gbpToUsdRate`

5. **Subtotal coberto com dólar (sem hotel/passagem)**
- GBP: `dollarEligibleCost`
- BRL: `dollarEligibleCost * gbpToBrlRate`
- USD: `dollarEligibleCost * gbpToUsdRate`

6. **Compra de USD informada**
- GBP: `usdPurchaseCostBrl / gbpToBrlRate`
- BRL: `usdPurchaseCostBrl`
- USD: `usdAmount`

7. **USD convertido para GBP**
- GBP: `convertedUsd`
- BRL: `convertedUsd * gbpToBrlRate`
- USD: `convertedUsd * gbpToUsdRate`

8. **Valor ainda necessário para dólar**
- GBP: `amountNeeded`
- BRL: `amountNeeded * gbpToBrlRate`
- USD: `amountNeeded * gbpToUsdRate`

9. **Passagem**
- GBP: `flightBrl / gbpToBrlRate`
- BRL: `flightBrl`
- USD: `(flightBrl / gbpToBrlRate) * gbpToUsdRate`

10. **Hospedagem**
- GBP: `lodgingBrl / gbpToBrlRate`
- BRL: `lodgingBrl`
- USD: `(lodgingBrl / gbpToBrlRate) * gbpToUsdRate`

11. **Meta total para poupar**
- GBP: `totalSavingTargetBrl / gbpToBrlRate`
- BRL: `totalSavingTargetBrl`
- USD: `totalSavingTargetBrl / usdToBrlRate`

12. **Poupança mensal**
- GBP: `monthlySavingGbp`
- BRL: `monthlySavingBrl`
- USD: `monthlySavingUsd`

13. **Custo total da viagem**
- GBP: `totalTripCostGbp`
- BRL: `totalTripCostBrl`
- USD: `totalTripCostGbp * gbpToUsdRate`
