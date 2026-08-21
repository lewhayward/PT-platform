"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { logFood } from "@/app/client/nutrition/actions";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";
import { BarcodeScanButton } from "@/components/barcode-scan-button";

export interface FoodOption {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export function LogFoodForm({ foods }: { foods: FoodOption[] }) {
  const [state, action] = useActionState(logFood, undefined);
  const [selectedFood, setSelectedFood] = useState<FoodOption | null>(null);
  const [quantity, setQuantity] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const caloriesRef = useRef<HTMLInputElement>(null);
  const proteinRef = useRef<HTMLInputElement>(null);
  const carbsRef = useRef<HTMLInputElement>(null);
  const fatRef = useRef<HTMLInputElement>(null);

  const foodsByName = useMemo(
    () => new Map(foods.map((food) => [food.name.trim().toLowerCase(), food])),
    [foods]
  );

  // Auto-fills calories/macros from the library once both a known food AND
  // a gram amount are entered - still just a starting point, every field
  // stays freely editable afterward for anything eaten slightly
  // differently from the library value.
  useEffect(() => {
    const grams = Number(quantity);
    if (!selectedFood || !grams || grams <= 0) return;
    const factor = grams / 100;
    if (caloriesRef.current) {
      caloriesRef.current.value = String(
        Math.round(selectedFood.caloriesPer100g * factor)
      );
    }
    if (proteinRef.current) {
      proteinRef.current.value = (selectedFood.proteinPer100g * factor).toFixed(1);
    }
    if (carbsRef.current) {
      carbsRef.current.value = (selectedFood.carbsPer100g * factor).toFixed(1);
    }
    if (fatRef.current) {
      fatRef.current.value = (selectedFood.fatPer100g * factor).toFixed(1);
    }
  }, [selectedFood, quantity]);

  return (
    <form
      key={state?.savedAt ?? "initial"}
      action={action}
      className="flex flex-col gap-3"
    >
      <Field label="Food" htmlFor="name" error={state?.errors?.name?.[0]}>
        <Input
          ref={nameInputRef}
          id="name"
          name="name"
          list="food-options"
          placeholder="e.g. Chicken and rice"
          onChange={(e) =>
            setSelectedFood(
              foodsByName.get(e.target.value.trim().toLowerCase()) ?? null
            )
          }
        />
        <datalist id="food-options">
          {foods.map((food) => (
            <option key={food.name} value={food.name} />
          ))}
        </datalist>
      </Field>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Field
            label="Amount (g) - optional"
            htmlFor="quantityG"
            error={state?.errors?.quantityG?.[0]}
          >
            <Input
              id="quantityG"
              name="quantityG"
              type="number"
              min={1}
              max={5000}
              placeholder="e.g. 200"
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
        </div>
        <BarcodeScanButton
          onScanned={(food) => {
            setSelectedFood(food);
            if (nameInputRef.current) {
              nameInputRef.current.value = food.name;
            }
          }}
        />
      </div>

      {selectedFood && (
        <p className="text-xs text-muted">
          Calories/macros filled in from the food library
          {quantity ? ` for ${quantity}g` : " - enter an amount in grams"} -
          feel free to adjust them.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field
          label="Calories"
          htmlFor="calories"
          error={state?.errors?.calories?.[0]}
        >
          <Input ref={caloriesRef} id="calories" name="calories" type="number" min={0} />
        </Field>
        <Field
          label="Protein (g)"
          htmlFor="proteinG"
          error={state?.errors?.proteinG?.[0]}
        >
          <Input
            ref={proteinRef}
            id="proteinG"
            name="proteinG"
            type="number"
            min={0}
            step="0.1"
          />
        </Field>
        <Field
          label="Carbs (g)"
          htmlFor="carbsG"
          error={state?.errors?.carbsG?.[0]}
        >
          <Input
            ref={carbsRef}
            id="carbsG"
            name="carbsG"
            type="number"
            min={0}
            step="0.1"
          />
        </Field>
        <Field label="Fat (g)" htmlFor="fatG" error={state?.errors?.fatG?.[0]}>
          <Input ref={fatRef} id="fatG" name="fatG" type="number" min={0} step="0.1" />
        </Field>
      </div>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <SubmitButton pendingLabel="Logging…" className="w-full sm:w-auto">
        Log food
      </SubmitButton>
    </form>
  );
}
