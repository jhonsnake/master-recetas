export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          calories: number | null
          carbs: number | null
          fiber: number | null
          sugar: number | null
          fat: number | null
          protein: number | null
          base_unit: string
          base_quantity: number
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          calories?: number | null
          carbs?: number | null
          fiber?: number | null
          sugar?: number | null
          fat?: number | null
          protein?: number | null
          base_unit: string
          base_quantity?: number
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          calories?: number | null
          carbs?: number | null
          fiber?: number | null
          sugar?: number | null
          fat?: number | null
          protein?: number | null
          base_unit?: string
          base_quantity?: number
          created_at?: string
          user_id?: string | null
        }
      }
      persons: {
        Row: {
          id: string
          name: string
          calories: number
          carbs: number
          fiber: number
          sugar: number
          fat: number
          protein: number
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          calories?: number
          carbs?: number
          fiber?: number
          sugar?: number
          fat?: number
          protein?: number
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          calories?: number
          carbs?: number
          fiber?: number
          sugar?: number
          fat?: number
          protein?: number
          created_at?: string
          user_id?: string | null
        }
      }
      unit_equivalences: {
        Row: {
          id: string
          ingredient_id: string
          unit_name: string
          conversion_factor: number
          created_at: string
        }
        Insert: {
          id?: string
          ingredient_id: string
          unit_name: string
          conversion_factor: number
          created_at?: string
        }
        Update: {
          id?: string
          ingredient_id?: string
          unit_name?: string
          conversion_factor?: number
          created_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          instructions: string[]
          user_id: string | null
          created_at: string
          porciones: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          instructions?: string[]
          user_id?: string | null
          created_at?: string
          porciones?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          instructions?: string[]
          user_id?: string | null
          created_at?: string
          porciones?: number | null
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_id: string
          quantity: number
          unit_name: string
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_id: string
          quantity: number
          unit_name: string
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_id?: string
          quantity?: number
          unit_name?: string
          created_at?: string
        }
      }
    }
    Views: {
      recipe_with_ingredients: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          instructions: string[]
          user_id: string | null
          created_at: string
          ingredients: {
            id: string
            name: string
            quantity: number
            unit_name: string
            base_unit: string
            conversion_factor: number
            conversion_text: string
            nutritional_values: {
              calories: number
              carbs: number
              fiber: number
              sugar: number
              fat: number
              protein: number
            }
          }[]
          total_nutrition: {
            calories: number
            carbs: number
            fiber: number
            sugar: number
            fat: number
            protein: number
          }
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}