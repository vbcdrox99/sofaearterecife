export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      materiais: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_unitario: number | null
          quantidade_atual: number
          quantidade_minima: number
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_unitario?: number | null
          quantidade_atual?: number
          quantidade_minima?: number
          unidade_medida?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_unitario?: number | null
          quantidade_atual?: number
          quantidade_minima?: number
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: []
      }
      pedido_anexos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome_arquivo: string
          pedido_id: string
          tipo_arquivo: string
          uploaded_by: string
          url_arquivo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome_arquivo: string
          pedido_id: string
          tipo_arquivo: string
          uploaded_by: string
          url_arquivo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome_arquivo?: string
          pedido_id?: string
          tipo_arquivo?: string
          uploaded_by?: string
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_anexos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_materiais: {
        Row: {
          created_at: string
          id: string
          material_id: string
          pedido_id: string
          quantidade_necessaria: number
          quantidade_reservada: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          pedido_id: string
          quantidade_necessaria: number
          quantidade_reservada?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          pedido_id?: string
          quantidade_necessaria?: number
          quantidade_reservada?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_materiais_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_materiais_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_endereco: string | null
          cliente_nome: string
          cliente_telefone: string
          created_at: string
          created_by: string
          data_previsao_entrega: string | null
          descricao_sofa: string
          id: string
          numero_pedido: number
          observacoes: string | null
          status: Database["public"]["Enums"]["status_pedido"]
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          cliente_endereco?: string | null
          cliente_nome: string
          cliente_telefone: string
          created_at?: string
          created_by: string
          data_previsao_entrega?: string | null
          descricao_sofa: string
          id?: string
          numero_pedido?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pedido"]
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          cliente_endereco?: string | null
          cliente_nome?: string
          cliente_telefone?: string
          created_at?: string
          created_by?: string
          data_previsao_entrega?: string | null
          descricao_sofa?: string
          id?: string
          numero_pedido?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pedido"]
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      producao_etapas: {
        Row: {
          concluida: boolean
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          etapa: Database["public"]["Enums"]["etapa_producao"]
          id: string
          observacoes: string | null
          pedido_id: string
          responsavel_id: string | null
          updated_at: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          etapa: Database["public"]["Enums"]["etapa_producao"]
          id?: string
          observacoes?: string | null
          pedido_id: string
          responsavel_id?: string | null
          updated_at?: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          etapa?: Database["public"]["Enums"]["etapa_producao"]
          id?: string
          observacoes?: string | null
          pedido_id?: string
          responsavel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_etapas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome_completo: string
          tipo: Database["public"]["Enums"]["tipo_usuario"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_completo: string
          tipo?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_completo?: string
          tipo?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      etapa_producao: "estrutura" | "estofamento" | "acabamento"
      status_pedido:
        | "aguardando_producao"
        | "em_producao"
        | "finalizado"
        | "em_entrega"
        | "entregue"
      tipo_usuario: "admin" | "funcionario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      etapa_producao: ["estrutura", "estofamento", "acabamento"],
      status_pedido: [
        "aguardando_producao",
        "em_producao",
        "finalizado",
        "em_entrega",
        "entregue",
      ],
      tipo_usuario: ["admin", "funcionario"],
    },
  },
} as const
