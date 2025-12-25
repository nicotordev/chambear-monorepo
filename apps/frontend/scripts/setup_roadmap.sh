#!/usr/bin/env bash
set -euo pipefail

REPO="nicotordev/chambear-frontend"

echo "Configuring repository: $REPO"

# --- Helpers ---
label_create() {
  local name="$1"
  local color="$2"
  # gh api: POST automatically when -f is provided :contentReference[oaicite:6]{index=6}
  gh api "repos/$REPO/labels" -f name="$name" -f color="$color" --silent >/dev/null 2>&1 || true
}

milestone_exists() {
  local title="$1"
  gh api "repos/$REPO/milestones" --paginate --jq '.[].title' 2>/dev/null | grep -Fxq "$title"
}

milestone_create() {
  local title="$1"
  if milestone_exists "$title"; then
    echo "Milestone '$title' already exists."
  else
    gh api "repos/$REPO/milestones" -f title="$title" --silent >/dev/null 2>&1 || true
    echo "Created milestone: $title"
  fi
}

issue_exists_by_exact_title() {
  local title="$1"
  # Use GitHub search qualifiers via --search (in:title) :contentReference[oaicite:7]{index=7}
  local count
  count="$(gh issue list -R "$REPO" --state all --search "in:title \"$title\"" --json number --jq 'length')"
  [[ "$count" -gt 0 ]]
}

issue_create() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local milestone="$4"

  if issue_exists_by_exact_title "$title"; then
    echo "Issue '$title' already exists. Skipping."
    return 0
  fi

  # -t/-b/-l/-m flags are valid per official gh issue create manual :contentReference[oaicite:8]{index=8}
  gh issue create -R "$REPO" -t "$title" -b "$body" -l "$labels" -m "$milestone" > /dev/null
  echo "Created issue: $title"
}

echo "Creating Labels..."
label_create "priority: P0" "B60205"
label_create "priority: P1" "D93F0B"
label_create "priority: P2" "FBCA04"
label_create "priority: P3" "FEF2C0"
label_create "priority: P4" "FFFFFF"

label_create "area: dashboard" "1D76DB"
label_create "area: ai" "5319E7"
label_create "area: data" "006B75"
label_create "area: infra" "BFDADC"
label_create "area: ux" "C2E0C6"

label_create "type: feature" "0E8A16"
label_create "type: chore" "C5DEF5"
label_create "type: research" "D4C5F9"

echo "Creating Milestones..."
milestone_create "M1 - Dashboard activo"
milestone_create "M2 - IA donde duele"
milestone_create "M3 - Engagement & habito"
milestone_create "M4 - Base sólida"
milestone_create "M5 - Validación real"

echo "Creating Issues..."

# P0 - Dashboard Activo (M1)
issue_create "Dashboard: Acciones claras en cada card" \
"## Objetivo
Que el usuario haga algo útil cada vez que entra. El dashboard debe empujar decisiones, no solo informar.

## Tareas
- [ ] Botón 'Optimizar CV para este puesto' en Job Card
- [ ] Botón 'Generar cover letter'
- [ ] Botón 'Preparar entrevista'
- [ ] Tooltip explicando por qué ese puesto fue recomendado" \
"priority: P0,area: dashboard,type: feature" \
"M1 - Dashboard activo"

issue_create "Dashboard: Fit Score explicable" \
"## Objetivo
Mostrar compatibilidad (%) por job y explicar por qué. Conecta directo con la propuesta de valor.

## Tareas
- [ ] Mostrar % de compatibilidad por job
- [ ] Breakdown simple: Skills match, Seniority, Stack
- [ ] CTA: 'Sube tu score +12% ajustando tu CV'" \
"priority: P0,area: dashboard,type: feature" \
"M1 - Dashboard activo"

issue_create "Dashboard: Estado de postulaciones visual" \
"## Objetivo
Visualizar el progreso de las postulaciones y alertar sobre estancamientos.

## Tareas
- [ ] Timeline por postulación: Aplicado → HR → Técnica → Oferta
- [ ] Señales de riesgo: 'Sin respuesta hace 10 días'
- [ ] CTA contextual: 'Enviar follow-up'" \
"priority: P0,area: dashboard,type: feature" \
"M1 - Dashboard activo"

# P1 - IA donde duele (M2)
issue_create "IA: CV & Cover Letter versionados" \
"## Objetivo
Reducir ansiedad y aumentar sensación de progreso mediante gestión inteligente de documentos.

## Tareas
- [ ] Historial de CVs generados
- [ ] Comparador: CV base vs CV optimizado
- [ ] Badge: 'ATS-friendly'" \
"priority: P1,area: ai,type: feature" \
"M2 - IA donde duele"

issue_create "IA: Preparación de entrevistas" \
"## Objetivo
Herramienta de alto valor para retención semanal.

## Tareas
- [ ] Preguntas generadas por: Empresa, Rol
- [ ] Checklist de preparación
- [ ] Feedback estructural (STAR)" \
"priority: P1,area: ai,type: feature" \
"M2 - IA donde duele"

# P2 - Engagement (M3)
issue_create "Engagement: Recordatorios inteligentes" \
"## Objetivo
Mantener al usuario activo y aplicando constantemente.

## Tareas
- [ ] Follow-up automático sugerido
- [ ] 'Esta semana deberías aplicar a 3 roles'
- [ ] Micro-objetivos visibles" \
"priority: P2,area: ux,type: feature" \
"M3 - Engagement & habito"

issue_create "Engagement: Progreso personal" \
"## Objetivo
Gamificación suave para mostrar avance.

## Tareas
- [ ] Métrica tipo: 'Probabilidad de entrevista ↑ 23%'
- [ ] Evolución del perfil
- [ ] Habilidades que mejoraron" \
"priority: P2,area: ux,type: feature" \
"M3 - Engagement & habito"

# P3 - Base solida (M4)
issue_create "Tech: Normalización de datos y Logging" \
"## Objetivo
Infraestructura necesaria para escalar y mejorar la IA.

## Tareas
- [ ] Normalizar estados de postulaciones
- [ ] Definir entidades claras: Job → CV → Interview
- [ ] Logging de acciones del usuario (para IA futura)" \
"priority: P3,area: data,type: chore" \
"M4 - Base sólida"

issue_create "Trust: Privacidad y Confianza" \
"## Objetivo
Asegurar al usuario sobre el uso de sus datos.

## Tareas
- [ ] Copy claro: qué hace la IA y qué no
- [ ] Control de datos (descargar / borrar)
- [ ] Explicabilidad básica del scoring" \
"priority: P3,area: infra,type: chore" \
"M4 - Base sólida"

# P4 - Validacion (M5)
issue_create "Product: Test con usuarios reales" \
"## Objetivo
Validar hipótesis antes de seguir construyendo.

## Tareas
- [ ] 5–10 devs / juniors / mid
- [ ] Preguntas clave: ¿Qué harías ahora? ¿Qué no entiendes? ¿Pagarías por esto?
- [ ] Recopilar feedback y ajustar roadmap" \
"priority: P4,type: research,area: ux" \
"M5 - Validación real"

echo "Done! Issues created."
