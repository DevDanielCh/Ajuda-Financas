use std::collections::BTreeMap;

use chrono::{Datelike, Months, NaiveDate};
use rusqlite::Connection;
use serde::Serialize;
use tauri::State;

use crate::db::{with_db_active, AppState};
use crate::shared::report::sync_generated;
use crate::shared::settings;
use crate::shared::util::db_err;

#[derive(Debug, Clone, Serialize)]
pub struct CalendarDay {
    /// YYYY-MM-DD (data civil da transação).
    pub date: String,
    pub income: i64,
    pub expenses: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CalendarMonth {
    /// YYYY-MM.
    pub month: String,
    pub income: i64,
    pub expenses: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CalendarYear {
    pub year: i32,
    pub days: Vec<CalendarDay>,
    pub months: Vec<CalendarMonth>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CalendarBounds {
    pub min_year: i32,
    pub max_year: i32,
}

fn daily_totals(
    conn: &Connection,
    account_id: i64,
    start: NaiveDate,
    end: NaiveDate,
    ty_clause: &str,
) -> Result<Vec<(String, i64)>, String> {
    let sql = format!(
        "SELECT date, COALESCE(SUM(amount), 0) FROM transactions
         WHERE {ty_clause} AND in_principal = 1 AND deleted_at IS NULL AND account_id = ?1
           AND date >= ?2 AND date < ?3
         GROUP BY date"
    );
    let mut stmt = conn.prepare(&sql).map_err(db_err)?;
    let rows = stmt
        .query_map(
            rusqlite::params![
                account_id,
                start.format("%Y-%m-%d").to_string(),
                end.format("%Y-%m-%d").to_string()
            ],
            |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)),
        )
        .map_err(db_err)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_err)?;
    Ok(rows)
}

/// Aggregados do ano na data civil de cada transação: compras de crédito
/// contam no dia da compra e a linha de Fatura (type 3) fica de fora —
/// senão a mesma compra contaria duas vezes. Os totais mensais são a soma
/// dos dias, então popup de dia e de mês sempre batem.
pub fn build_calendar(conn: &Connection, account_id: i64, year: i32) -> Result<CalendarYear, String> {
    let start = NaiveDate::from_ymd_opt(year, 1, 1).ok_or_else(|| format!("ano inválido: {year}"))?;
    let end = start.checked_add_months(Months::new(12)).unwrap();

    let mut merged: BTreeMap<String, (i64, i64)> = BTreeMap::new();
    for (date, v) in daily_totals(conn, account_id, start, end, "type IN (1, 5)")? {
        merged.entry(date).or_default().0 += v;
    }
    for (date, v) in daily_totals(conn, account_id, start, end, "type IN (2, 4)")? {
        merged.entry(date).or_default().1 += v;
    }

    let days = merged
        .into_iter()
        .map(|(date, (income, expenses))| CalendarDay { date, income, expenses })
        .collect::<Vec<_>>();

    let mut months: Vec<CalendarMonth> = (1..=12)
        .map(|m| CalendarMonth {
            month: format!("{year}-{m:02}"),
            income: 0,
            expenses: 0,
        })
        .collect();
    for day in &days {
        let idx = day.date[5..7].parse::<usize>().unwrap_or(1) - 1;
        if let Some(m) = months.get_mut(idx) {
            m.income += day.income;
            m.expenses += day.expenses;
        }
    }

    Ok(CalendarYear { year, days, months })
}

fn bounds_impl(conn: &Connection, account_id: i64) -> Result<CalendarBounds, String> {
    let min_month = settings::earliest_month(conn, account_id)?;
    let now_year = chrono::Local::now().date_naive().year();
    let min_year: i32 = min_month
        .get(..4)
        .and_then(|y| y.parse().ok())
        .unwrap_or(now_year);
    let max_date: Option<String> = conn
        .query_row(
            "SELECT MAX(date) FROM transactions WHERE deleted_at IS NULL AND account_id = ?1",
            [account_id],
            |r| r.get(0),
        )
        .map_err(db_err)?;
    let max_year: i32 = max_date
        .as_deref()
        .and_then(|d| d.get(..4))
        .and_then(|y| y.parse().ok())
        .unwrap_or(min_year)
        .max(min_year);
    Ok(CalendarBounds { min_year, max_year })
}

#[tauri::command]
pub async fn get_calendar_year(
    state: State<'_, AppState>,
    year: i32,
) -> Result<CalendarYear, String> {
    let now = chrono::Local::now().date_naive();
    with_db_active(&state, |c, a| {
        sync_generated(c, now)?;
        build_calendar(c, a, year)
    })
}

#[tauri::command]
pub async fn get_calendar_bounds(state: State<'_, AppState>) -> Result<CalendarBounds, String> {
    with_db_active(&state, |c, a| bounds_impl(c, a))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::shared::{add_pm, add_tx, test_db};
    use rusqlite::params;

    fn add_typed(conn: &Connection, desc: &str, amount: i64, ty: i64, date: &str) {
        conn.execute(
            "INSERT INTO transactions (description, amount, type, date) VALUES (?1, ?2, ?3, ?4)",
            params![desc, amount, ty, date],
        )
        .unwrap();
    }

    fn day(cal: &CalendarYear, date: &str) -> (i64, i64) {
        cal.days
            .iter()
            .find(|d| d.date == date)
            .map(|d| (d.income, d.expenses))
            .unwrap_or((0, 0))
    }

    fn month(cal: &CalendarYear, month: &str) -> (i64, i64) {
        cal.months
            .iter()
            .find(|m| m.month == month)
            .map(|m| (m.income, m.expenses))
            .unwrap_or((0, 0))
    }

    #[test]
    fn compra_credito_conta_na_data_e_fatura_fica_de_fora() {
        let conn = test_db();
        let card = add_pm(&conn, "Nubank", 2, Some(r#"{"close_day":10,"validity_day":20}"#));
        add_tx(&conn, "compra crédito", 5000, "2026-05-15", Some(card));
        crate::shared::card_bills::ensure_card_bills(&conn, 1, NaiveDate::from_ymd_opt(2026, 6, 1).unwrap()).unwrap();

        let cal = build_calendar(&conn, 1, 2026).unwrap();
        assert_eq!(day(&cal, "2026-05-15"), (0, 5000), "compra no dia real");
        assert_eq!(day(&cal, "2026-06-20"), (0, 0), "linha de fatura não aparece");
        assert_eq!(month(&cal, "2026-05"), (0, 5000));
        assert_eq!(month(&cal, "2026-06"), (0, 0));
        assert_eq!(
            cal.days.iter().map(|d| d.expenses).sum::<i64>(),
            cal.months.iter().map(|m| m.expenses).sum::<i64>(),
            "soma dos dias == soma dos meses"
        );
    }

    #[test]
    fn debito_e_no_pm_contam_na_data_compra_credito_tambem() {
        let conn = test_db();
        let card = add_pm(&conn, "Nubank", 2, Some(r#"{"close_day":10,"validity_day":20}"#));
        let pix = add_pm(&conn, "PIX", 1, None);
        add_tx(&conn, "débito no cartão", 3000, "2026-07-03", Some(card));
        conn.execute(
            "INSERT INTO transactions (description, amount, type, date, payment_method_id, card_mode)
             VALUES ('débito cartão', 1500, 2, '2026-07-04', ?1, 1)",
            params![card],
        )
        .unwrap();
        add_tx(&conn, "pix", 700, "2026-07-10", Some(pix));
        add_tx(&conn, "sem pm", 200, "2026-07-11", None);

        let cal = build_calendar(&conn, 1, 2026).unwrap();
        assert_eq!(day(&cal, "2026-07-03"), (0, 3000));
        assert_eq!(day(&cal, "2026-07-04"), (0, 1500));
        assert_eq!(day(&cal, "2026-07-10"), (0, 700));
        assert_eq!(day(&cal, "2026-07-11"), (0, 200));
        assert_eq!(month(&cal, "2026-07"), (0, 5400));
    }

    #[test]
    fn receitas_reserva_e_in_principal() {
        let conn = test_db();
        add_typed(&conn, "salário", 10000, 1, "2026-03-10");
        add_typed(&conn, "aporte", 5000, 4, "2026-03-12");
        add_typed(&conn, "resgate", 2000, 5, "2026-03-15");
        add_typed(&conn, "ignorado", 9999, 2, "2026-03-20");
        conn.execute(
            "UPDATE transactions SET in_principal = 0 WHERE description = 'ignorado'",
            [],
        )
        .unwrap();

        let cal = build_calendar(&conn, 1, 2026).unwrap();
        assert_eq!(day(&cal, "2026-03-10"), (10000, 0));
        assert_eq!(day(&cal, "2026-03-12"), (0, 5000), "adição vira despesa");
        assert_eq!(day(&cal, "2026-03-15"), (2000, 0), "remoção vira receita");
        assert_eq!(day(&cal, "2026-03-20"), (0, 0), "in_principal = 0 fora");
        assert_eq!(month(&cal, "2026-03"), (12000, 5000));
    }

    #[test]
    fn bounds_usa_primeiro_mes_e_max_date() {
        let conn = test_db();
        add_typed(&conn, "antiga", 100, 2, "2023-11-05");
        add_typed(&conn, "recente", 100, 2, "2026-02-01");

        let b = bounds_impl(&conn, 1).unwrap();
        assert_eq!(b.min_year, 2023);
        assert_eq!(b.max_year, 2026);

        conn.execute(
            "INSERT INTO settings (account_id, key, value) VALUES (1, 'primeiro_mes', '2024-05')
             ON CONFLICT(account_id, key) DO UPDATE SET value = excluded.value",
            [],
        )
        .unwrap();
        let b = bounds_impl(&conn, 1).unwrap();
        assert_eq!(b.min_year, 2024, "primeiro_mes configurado é o piso");
        assert_eq!(b.max_year, 2026);
    }

    #[test]
    fn bounds_sem_transacoes_usa_ano_atual() {
        let conn = test_db();
        let b = bounds_impl(&conn, 1).unwrap();
        let now = chrono::Local::now().date_naive().year();
        assert_eq!(b.min_year, now);
        assert_eq!(b.max_year, now);
    }
}
