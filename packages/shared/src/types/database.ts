/**
 * Tipos del esquema Postgres.
 *
 * ESTE FICHERO SE GENERA. No lo edites a mano una vez el proyecto Supabase
 * este conectado:
 *
 *     pnpm db:types
 *
 * La version inicial se escribio a mano, fiel a las migraciones de
 * supabase/migrations, para que el proyecto tipe correctamente antes de existir
 * la instancia. En cuanto haya proyecto, regenera y sustituye.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CheckinEstado = 'en_racha' | 'recaida';
export type ArticleEstado = 'draft' | 'aprobado' | 'publicado';
export type CourseTipo = 'gratis' | 'premium';
export type ProductTipo = 'libro' | 'reto' | 'programa' | 'mastermind';
export type EntitlementOrigen = 'stripe' | 'manual';
export type NotificationTipo = 'articulo_diario' | 'recordatorio_checkin' | 'hito' | 'sistema';
export type ConsentTipo = 'datos_sensibles' | 'marketing_email' | 'push' | 'analitica';
export type SuscriptorEstado = 'pendiente' | 'confirmado' | 'baja';

/**
 * Forma del esquema de Reset Alfa.
 *
 * Se extrae aparte porque el mismo esquema puede instalarse de dos maneras:
 *
 *   `public`      Instalacion normal, en un proyecto Supabase dedicado.
 *   `reset_alfa`  Instalacion aislada, cuando el proyecto Supabase se comparte
 *                 con otra aplicacion (supabase/instalacion-esquema-aislado.sql).
 *
 * Ambas claves apuntan a la MISMA definicion, asi que el codigo tipa igual
 * apunte donde apunte, y cambiar de una a otra es solo cambiar una variable de
 * entorno.
 */
export interface EsquemaResetAlfa {
  Tables: {
    profiles: {
      Row: {
        id: string;
        user_id: string;
        nombre: string;
        avatar_url: string | null;
        timezone: string;
        record_personal: number;
        dias_totales: number;
        onboarding_completado: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: never;
      /**
       * Solo estas columnas son escribibles por el cliente. `record_personal`
       * y `dias_totales` estan revocadas por GRANT en la migracion 0002:
       * las mueve unicamente el RPC de check-in.
       */
      Update: Partial<
        Pick<
          Database['public']['Tables']['profiles']['Row'],
          'nombre' | 'avatar_url' | 'timezone' | 'onboarding_completado'
        >
      >;
      Relationships: [];
    };

    consents: {
      Row: {
        id: string;
        user_id: string;
        tipo: ConsentTipo;
        concedido: boolean;
        version_politica: string;
        origen: 'app' | 'web';
        ip_hash: string | null;
        user_agent: string | null;
        created_at: string;
      };
      Insert: {
        user_id: string;
        tipo: ConsentTipo;
        concedido: boolean;
        version_politica: string;
        origen?: 'app' | 'web';
        ip_hash?: string | null;
        user_agent?: string | null;
      };
      /** Libro de registro de solo insercion: no admite modificacion. */
      Update: never;
      Relationships: [];
    };

    streaks: {
      Row: {
        id: string;
        user_id: string;
        fecha_inicio: string;
        fecha_fin: string | null;
        dias_actuales: number;
        activa: boolean;
        created_at: string;
        updated_at: string;
      };
      /** Escritura reservada al RPC de la Fase 2. */
      Insert: never;
      Update: never;
      Relationships: [];
    };

    checkins: {
      Row: {
        id: string;
        user_id: string;
        streak_id: string | null;
        fecha: string;
        estado: CheckinEstado;
        created_at: string;
      };
      /** Escritura reservada al RPC de la Fase 2. */
      Insert: never;
      Update: never;
      Relationships: [];
    };

    relapses: {
      Row: {
        id: string;
        user_id: string;
        checkin_id: string;
        lugar: string | null;
        hora: string | null;
        trigger: string | null;
        accion_correctiva: string | null;
        ejecuto_pad: boolean | null;
        motivo_fallo: string | null;
        ajuste_pad: string | null;
        contexto_ambiental: string | null;
        contexto_emocional: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        user_id: string;
        checkin_id: string;
        lugar?: string | null;
        hora?: string | null;
        trigger?: string | null;
        accion_correctiva?: string | null;
        ejecuto_pad?: boolean | null;
        motivo_fallo?: string | null;
        ajuste_pad?: string | null;
        contexto_ambiental?: string | null;
        contexto_emocional?: string | null;
      };
      Update: Partial<Database['public']['Tables']['relapses']['Insert']>;
      Relationships: [];
    };

    autores: {
      Row: {
        id: string;
        slug: string;
        nombre: string;
        bio: string;
        avatar_url: string | null;
        url_web: string | null;
        url_social: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: never;
      Update: never;
      Relationships: [];
    };

    categorias: {
      Row: {
        slug: string;
        nombre: string;
        descripcion: string | null;
        meta_description: string | null;
        orden: number;
        created_at: string;
      };
      Insert: never;
      Update: never;
      Relationships: [];
    };

    articles: {
      Row: {
        id: string;
        slug: string;
        titulo: string;
        meta_description: string | null;
        contenido_md: string;
        categoria: string;
        autor_id: string | null;
        estado: ArticleEstado;
        fecha_publicacion: string | null;
        tiempo_lectura: number | null;
        keywords: string[];
        og_image_url: string | null;
        created_at: string;
        updated_at: string;
      };
      /** Solo service_role (n8n). */
      Insert: never;
      Update: never;
      Relationships: [];
    };

    products: {
      Row: {
        id: string;
        slug: string;
        nombre: string;
        descripcion: string | null;
        tipo: ProductTipo;
        precio_cents: number;
        moneda: string;
        stripe_price_id: string | null;
        url_web: string | null;
        imagen_url: string | null;
        activo: boolean;
        orden: number;
        created_at: string;
        updated_at: string;
      };
      Insert: never;
      Update: never;
      Relationships: [];
    };

    entitlements: {
      Row: {
        id: string;
        user_id: string;
        product_id: string;
        origen: EntitlementOrigen;
        activo: boolean;
        expires_at: string | null;
        stripe_checkout_session_id: string | null;
        created_at: string;
        updated_at: string;
      };
      /**
       * Escribe SOLO el webhook de Stripe con service_role. El cliente esta
       * bloqueado por la RLS —no hay politica de INSERT ni de UPDATE—, no por
       * este tipo: la garantia vive en la base de datos.
       */
      Insert: {
        user_id: string;
        product_id: string;
        origen?: EntitlementOrigen;
        activo?: boolean;
        expires_at?: string | null;
        stripe_checkout_session_id?: string | null;
      };
      Update: {
        activo?: boolean;
        expires_at?: string | null;
      };
      Relationships: [];
    };

    push_tokens: {
      Row: {
        id: string;
        user_id: string;
        token: string;
        plataforma: 'ios' | 'android';
        activo: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        user_id: string;
        token: string;
        plataforma: 'ios' | 'android';
        activo?: boolean;
      };
      Update: { activo?: boolean };
      Relationships: [];
    };

    courses: {
      Row: {
        id: string;
        slug: string;
        titulo: string;
        descripcion: string | null;
        tipo: CourseTipo;
        product_id: string | null;
        imagen_url: string | null;
        orden: number;
        publicado: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: never;
      Update: never;
      Relationships: [];
    };

    lessons: {
      Row: {
        id: string;
        course_id: string;
        titulo: string;
        video_url: string | null;
        contenido_md: string | null;
        orden: number;
        /** Segundos, misma unidad que progress.ultima_posicion. */
        duracion: number | null;
        created_at: string;
        updated_at: string;
      };
      Insert: never;
      Update: never;
      Relationships: [];
    };

    progress: {
      Row: {
        id: string;
        user_id: string;
        lesson_id: string;
        completada: boolean;
        ultima_posicion: number;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        user_id: string;
        lesson_id: string;
        completada?: boolean;
        ultima_posicion?: number;
      };
      Update: Partial<Pick<
        Database['public']['Tables']['progress']['Row'],
        'completada' | 'ultima_posicion'
      >>;
      Relationships: [];
    };

    email_subscribers: {
      Row: {
        id: string;
        email: string;
        estado: SuscriptorEstado;
        origen: string | null;
        token: string;
        version_politica: string | null;
        ip_hash: string | null;
        created_at: string;
        confirmado_at: string | null;
        baja_at: string | null;
      };
      /** Solo desde el servidor (service_role): la tabla no tiene RLS abierta. */
      Insert: {
        email: string;
        origen?: string | null;
        version_politica?: string | null;
        ip_hash?: string | null;
      };
      Update: {
        estado?: SuscriptorEstado;
        confirmado_at?: string | null;
        baja_at?: string | null;
      };
      Relationships: [];
    };

    notifications: {
      Row: {
        id: string;
        user_id: string;
        tipo: NotificationTipo;
        titulo: string;
        cuerpo: string;
        deeplink: string | null;
        leida: boolean;
        created_at: string;
      };
      Insert: never;
      /** Solo la columna `leida` esta concedida por GRANT. */
      Update: { leida: boolean };
      Relationships: [];
    };
  };

  Views: Record<string, never>;
  CompositeTypes: Record<string, never>;

  Functions: {
    export_my_data: {
      Args: Record<string, never>;
      Returns: Json;
    };
    delete_my_account: {
      Args: Record<string, never>;
      Returns: undefined;
    };

    // Motor de rachas (migracion 0011). Toda la escritura de rachas pasa por
    // estos RPC: `streaks` y `checkins` solo tienen politicas de SELECT.
    estado_diario: {
      Args: Record<string, never>;
      Returns: Json;
    };
    registrar_checkin: {
      Args: Record<string, never>;
      Returns: Json;
    };
    guardar_recaida: {
      Args: {
        p_lugar?: string | null;
        p_hora?: string | null;
        p_trigger?: string | null;
        p_accion_correctiva?: string | null;
        p_ejecuto_pad?: boolean | null;
        p_motivo_fallo?: string | null;
        p_ajuste_pad?: string | null;
        p_contexto_ambiental?: string | null;
        p_contexto_emocional?: string | null;
      };
      Returns: Json;
    };
    calendario_mes: {
      Args: { p_anio: number; p_mes: number };
      Returns: Json;
    };

    // --- Retencion (migracion 0013) ---
    // patrones_recaidas es SECURITY INVOKER: pasa por la RLS, asi que solo
    // puede devolver patrones del propio usuario.
    patrones_recaidas: {
      Args: Record<string, never>;
      Returns: Json;
    };
  };

  Enums: {
    checkin_estado: CheckinEstado;
    article_estado: ArticleEstado;
    course_tipo: CourseTipo;
    product_tipo: ProductTipo;
    entitlement_origen: EntitlementOrigen;
    notification_tipo: NotificationTipo;
    consent_tipo: ConsentTipo;
    suscriptor_estado: SuscriptorEstado;
  };
}

export interface Database {
  public: EsquemaResetAlfa;
  reset_alfa: EsquemaResetAlfa;
}

/** Esquemas validos. Debe coincidir con lo que se instalo en la base. */
export type EsquemaSupabase = 'public' | 'reset_alfa';

/** Atajo: `Tables<'profiles'>` en lugar de la ruta completa. */
export type Tables<T extends keyof EsquemaResetAlfa['Tables']> =
  EsquemaResetAlfa['Tables'][T]['Row'];
