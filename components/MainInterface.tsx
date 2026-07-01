"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Plus, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import IngredientInput from "./IngredientInput";
import VibeSelector from "./VibeSelector";
import RecipeDisplay from "./RecipeDisplay";
import RecipeGenerationProgress from "./RecipeGenerationProgress";

export default function MainInterface() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [letMiseDecide, setLetMiseDecide] = useState(false);
  const [currentInputValue, setCurrentInputValue] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [generationProgress, setGenerationProgress] = useState<
    "idle" | "processing" | "saving" | "complete"
  >("idle");

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleAddIngredient = (ingredient: string) => {
    if (ingredient && !ingredients.includes(ingredient)) {
      setIngredients([...ingredients, ingredient]);
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
  };

  const handleVibeToggle = (vibe: string) => {
    console.log("selectedVibes", selectedVibes);
    console.log("toggled", vibe);
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe));
    } else {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };

  const handleGenerateRecipe = async () => {
    // Check if we have either ingredients or an image
    if (!currentInputValue.trim() && !uploadedImage) {
      toast.error("Please add ingredients and/or upload an image");
      return;
    }

    if (!user) {
      toast.error("Please sign in to generate recipes.");
      router.push("/login");
      return;
    }

    setIsGenerating(true);

    try {
      let response;

      if (uploadedImage) {
        // If we have an image, use FormData
        const formData = new FormData();
        formData.append("image", uploadedImage);

        // Include ingredients text if provided
        const ingredientsArray = currentInputValue.trim()
          ? [currentInputValue.trim()]
          : [];
        formData.append("ingredients", JSON.stringify(ingredientsArray));
        formData.append(
          "vibes",
          JSON.stringify(letMiseDecide ? [] : selectedVibes)
        );
        formData.append("letMiseDecide", letMiseDecide.toString());

        setGenerationProgress("processing");

        response = await fetch("/api/generate-recipe", {
          method: "POST",
          body: formData,
        });
      } else {
        // If we only have ingredients, use JSON
        const ingredientsText = currentInputValue.trim();
        const finalIngredients = [ingredientsText];

        setGenerationProgress("processing");

        response = await fetch("/api/generate-recipe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredients: finalIngredients,
            vibes: letMiseDecide ? [] : selectedVibes,
            letMiseDecide: letMiseDecide,
          }),
        });
      }

      if (response.status === 401) {
        toast.error("Please sign in to generate recipes.");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to generate recipe");
      }

      setGenerationProgress("saving");

      setGenerationProgress("saving");
      const data = await response.json();

      // Extract the recipe from the response structure
      const recipe = data.recipe || data;
      setGeneratedRecipe(recipe);
      setGenerationProgress("complete");

      // Show generation time if available
      const generationTime = data.generation_time_ms;
      if (generationTime) {
        toast.success(
          `Recipe generated in ${(generationTime / 1000).toFixed(1)}s!`
        );
      } else {
        toast.success("Recipe generated!");
      }

      // Show tip about images if they're being generated
      if (!recipe.image_url) {
        toast("🖼️ Recipe image is being generated and will appear shortly!", {
          icon: "🖼️",
          duration: 4000,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to generate recipe: ${errorMessage}`);
      console.error("Recipe generation error:", error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress("idle");
    }
  };

  const handleImageUpload = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    console.log("Image uploaded:", file.name, file.size, file.type);

    // Store the image for later use when generate button is pressed
    setUploadedImage(file);
    toast.success(
      `Image "${file.name}" uploaded! Add ingredients or vibes, then press Generate Recipe.`
    );
  };

  if (generatedRecipe) {
    return (
      <RecipeDisplay
        recipe={generatedRecipe}
        onStartOver={() => {
          setGeneratedRecipe(null);
          setIngredients([]);
          setSelectedVibes([]);
          setLetMiseDecide(false);
          setCurrentInputValue("");
          setUploadedImage(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-spectral text-heading text-text-charcoal mb-4">
          Let's make something out of nothing.
        </h1>
      </div>

      {/* Main Content Panel */}
      <div className="mise-card">
        {/* Ingredient Input Section */}
        <div className="mb-8">
          <IngredientInput onInputChange={setCurrentInputValue} />

          {/* And/Or divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-outline-gray"></div>
            <span className="text-helper-text text-sm">and/or</span>
            <div className="flex-1 h-px bg-outline-gray"></div>
          </div>

          {/* Image Upload Options */}
          <div className="text-center mb-4">
            <p className="text-helper-text text-sm mb-3">
              Upload a photo to enhance your recipe generation
            </p>
            <div className="flex justify-center">
              <label className="mise-button-secondary cursor-pointer flex items-center gap-2">
                <Upload size={16} />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </label>
            </div>

            {/* Show uploaded image info */}
            {uploadedImage && (
              <div className="mt-3 p-3 bg-olive-oil-gold/10 rounded-mise border border-olive-oil-gold/20">
                <p className="text-olive-oil-gold text-sm font-medium">
                  📸 Image uploaded: {uploadedImage.name}
                </p>
                <button
                  onClick={() => setUploadedImage(null)}
                  className="text-xs text-helper-text hover:text-text-charcoal mt-1"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vibe Selection */}
        <div className="mb-8">
          <h2 className="font-spectral text-subheading text-text-charcoal mb-4">
            Choose your vibe
          </h2>
          <VibeSelector
            selectedVibes={selectedVibes}
            onVibeToggle={handleVibeToggle}
            disabled={letMiseDecide}
          />
        </div>

        {/* Let Mise Decide Option */}
        <div className="mb-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={letMiseDecide}
              onChange={(e) => setLetMiseDecide(e.target.checked)}
              className="w-4 h-4 text-olive-oil-gold bg-butcher-paper border-outline-gray rounded focus:ring-olive-oil-gold/30 focus:ring-2"
            />
            <span className="text-helper text-helper-text font-inter">
              Skip this to let Mise decide.
            </span>
          </label>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={handleGenerateRecipe}
            disabled={
              isGenerating || (!currentInputValue.trim() && !uploadedImage)
            }
            className="mise-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-cast-iron border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Generate Recipe
              </>
            )}
          </button>
          <p className="text-helper-text text-xs mt-2">
            Add ingredients and/or upload a photo to get started
          </p>
        </div>
      </div>

      {/* Progress Modal */}
      <RecipeGenerationProgress
        isGenerating={isGenerating}
        progress={generationProgress}
        estimatedTime={6000} // 6 seconds estimated time
      />
    </div>
  );
}
