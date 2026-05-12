/**
 * HPP (Cost of Goods Sold) Per Unit (Egg)
 * Formula: (Total Fixed Cost + Total Variable Cost) / Total Good Eggs
 * Note: Damaged eggs are NOT included in the divisor.
 */
export function calculateHPP(
    totalFixedCost: number,
    totalVariableCost: number,
    totalGoodEggs: number
): number {
    if (totalGoodEggs <= 0) return 0;
    return (totalFixedCost + totalVariableCost) / totalGoodEggs;
}

/**
 * Pricing Strategy (Cost-Plus)
 * Formula: HPP * (1 + Margin Percentage)
 * Margin Percentage should be passed as a decimal (e.g., 0.20 for 20%)
 */
export function calculatePricing(hpp: number, marginPercentage: number): number {
    return hpp * (1 + marginPercentage);
}

/**
 * BEP (Break Even Point) in Units
 * Formula: Total Fixed Cost / (Selling Price - Variable Cost Per Unit)
 */
export function calculateBEP(
    totalFixedCost: number,
    sellingPrice: number,
    variableCostPerUnit: number
): number {
    const contributionMargin = sellingPrice - variableCostPerUnit;
    if (contributionMargin <= 0) return 0; // Avoid division by zero or negative BEP
    return totalFixedCost / contributionMargin;
}

interface FinancialData {
    totalFixedCost: number;
    totalVariableCost: number;
    totalGoodEggs: number;
    marginPercentage: number;
    sellingPrice: number;
}

export function calculateFarmFinances(data: FinancialData) {
    const hpp = calculateHPP(
        data.totalFixedCost,
        data.totalVariableCost,
        data.totalGoodEggs
    );

    const recommendedPrice = calculatePricing(hpp, data.marginPercentage);

    // Variable Cost Per Unit = Total Variable Cost / Total Good Eggs
    const variableCostPerUnit =
        data.totalGoodEggs > 0 ? data.totalVariableCost / data.totalGoodEggs : 0;

    const bepUnits = calculateBEP(
        data.totalFixedCost,
        data.sellingPrice, // Use actual selling price for BEP, or recommendedPrice if strict
        variableCostPerUnit
    );

    return {
        hpp,
        recommendedPrice,
        bepUnits,
        variableCostPerUnit,
    };
}
