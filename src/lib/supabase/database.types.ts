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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      carimbos: {
        Row: {
          cancelado_em: string | null
          cartela_id: string
          cliente_id: string
          criado_em: string
          id: string
          motivo: string | null
          origem: string
          salao_id: string
          visita_id: string | null
        }
        Insert: {
          cancelado_em?: string | null
          cartela_id: string
          cliente_id: string
          criado_em?: string
          id?: string
          motivo?: string | null
          origem: string
          salao_id: string
          visita_id?: string | null
        }
        Update: {
          cancelado_em?: string | null
          cartela_id?: string
          cliente_id?: string
          criado_em?: string
          id?: string
          motivo?: string | null
          origem?: string
          salao_id?: string
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carimbos_cartela_id_fkey"
            columns: ["cartela_id"]
            isOneToOne: false
            referencedRelation: "cartelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carimbos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carimbos_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "saloes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carimbos_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      cartelas: {
        Row: {
          cliente_id: string
          completada_em: string | null
          criado_em: string
          id: string
          meta_carimbos: number
          resgatada_em: string | null
          salao_id: string
          status: string
        }
        Insert: {
          cliente_id: string
          completada_em?: string | null
          criado_em?: string
          id?: string
          meta_carimbos?: number
          resgatada_em?: string | null
          salao_id: string
          status?: string
        }
        Update: {
          cliente_id?: string
          completada_em?: string | null
          criado_em?: string
          id?: string
          meta_carimbos?: number
          resgatada_em?: string | null
          salao_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartelas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartelas_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "saloes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          aniversario: string | null
          consentimento_lgpd_em: string | null
          criado_em: string
          email: string | null
          id: string
          indicada_por_id: string | null
          nome: string
          observacoes: string | null
          salao_id: string
          telefone: string
        }
        Insert: {
          aniversario?: string | null
          consentimento_lgpd_em?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          indicada_por_id?: string | null
          nome: string
          observacoes?: string | null
          salao_id: string
          telefone: string
        }
        Update: {
          aniversario?: string | null
          consentimento_lgpd_em?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          indicada_por_id?: string | null
          nome?: string
          observacoes?: string | null
          salao_id?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_indicada_por_id_fkey"
            columns: ["indicada_por_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "saloes"
            referencedColumns: ["id"]
          },
        ]
      }
      saloes: {
        Row: {
          criado_em: string
          dono_id: string
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          dono_id: string
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          dono_id?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      visitas: {
        Row: {
          cancelada_em: string | null
          cartela_resgatada_id: string | null
          chave_idempotencia: string | null
          cliente_id: string
          criado_em: string
          data: string
          id: string
          salao_id: string
          servico: string | null
          tipo: string
        }
        Insert: {
          cancelada_em?: string | null
          cartela_resgatada_id?: string | null
          chave_idempotencia?: string | null
          cliente_id: string
          criado_em?: string
          data?: string
          id?: string
          salao_id: string
          servico?: string | null
          tipo?: string
        }
        Update: {
          cancelada_em?: string | null
          cartela_resgatada_id?: string | null
          chave_idempotencia?: string | null
          cliente_id?: string
          criado_em?: string
          data?: string
          id?: string
          salao_id?: string
          servico?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitas_cartela_resgatada_id_fkey"
            columns: ["cartela_resgatada_id"]
            isOneToOne: false
            referencedRelation: "cartelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "saloes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _atualizar_status_cartela: {
        Args: { p_cartela_id: string }
        Returns: number
      }
      _cartela_aberta: {
        Args: { p_cliente_id: string; p_salao_id: string }
        Returns: {
          cliente_id: string
          completada_em: string | null
          criado_em: string
          id: string
          meta_carimbos: number
          resgatada_em: string | null
          salao_id: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "cartelas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _cartela_json: { Args: { p_cartela_id: string }; Returns: Json }
      _cliente_do_usuario: {
        Args: { p_cliente_id: string }
        Returns: {
          aniversario: string | null
          consentimento_lgpd_em: string | null
          criado_em: string
          email: string | null
          id: string
          indicada_por_id: string | null
          nome: string
          observacoes: string | null
          salao_id: string
          telefone: string
        }
        SetofOptions: {
          from: "*"
          to: "clientes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      buscar_clientes: {
        Args: { p_termo?: string }
        Returns: {
          carimbos: number
          id: string
          meta_carimbos: number
          nome: string
          premio_disponivel: boolean
          telefone: string
        }[]
      }
      conceder_carimbo: {
        Args: { p_cliente_id: string; p_motivo: string }
        Returns: Json
      }
      desfazer_visita: { Args: { p_visita_id: string }; Returns: Json }
      registrar_visita: {
        Args: {
          p_chave_idempotencia?: string
          p_cliente_id: string
          p_data?: string
          p_servico?: string
        }
        Returns: Json
      }
      resgatar_premio: {
        Args: { p_cartela_id: string; p_data?: string; p_servico?: string }
        Returns: Json
      }
      sem_acento: { Args: { texto: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
