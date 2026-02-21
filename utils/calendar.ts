export const generateICS = (events: { title: string; description?: string; startTime: string; durationMinutes: number }[]) => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MindTrack//Study Plan//EN\n";

    events.forEach(event => {
        const startDate = new Date(event.startTime);
        const endDate = new Date(startDate.getTime() + event.durationMinutes * 60000);

        const formatDate = (date: Date) => {
            return date.toISOString().replace(/-|:|\.\d+/g, "");
        };

        icsContent += "BEGIN:VEVENT\n";
        icsContent += `SUMMARY:${event.title}\n`;
        if (event.description) icsContent += `DESCRIPTION:${event.description}\n`;
        icsContent += `DTSTART:${formatDate(startDate)}\n`;
        icsContent += `DTEND:${formatDate(endDate)}\n`;
        icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    return icsContent;
};

export const downloadICS = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
