interface FormatDateOptions {
  showTime?: boolean;
  monthStyle?: 'short' | 'long';
  dayStyle?: 'numeric' | '2-digit';
}

export function formatDate(dateStr?: string, options: FormatDateOptions = {}): string {
  if (!dateStr) return '-';
  const { showTime = false, monthStyle = 'short', dayStyle = 'numeric' } = options;
  try {
    const d = new Date(dateStr);
    const opts: Intl.DateTimeFormatOptions = {
      day: dayStyle,
      month: monthStyle,
      year: 'numeric',
    };
    if (showTime) {
      opts.hour = '2-digit';
      opts.minute = '2-digit';
    }
    return d.toLocaleDateString('id-ID', opts);
  } catch {
    return dateStr;
  }
}
