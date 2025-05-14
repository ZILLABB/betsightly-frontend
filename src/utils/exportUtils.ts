import type { Prediction } from "../types";

/**
 * Convert predictions to CSV format with comprehensive null checks
 */
export const predictionsToCSV = (predictions: Prediction[]): string => {
  if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
    return "";
  }

  // Define CSV headers
  const headers = [
    "Game",
    "League",
    "Sport",
    "Prediction",
    "Odds",
    "Status",
    "Game Time",
    "Reason",
    "Bookmaker",
    "Game Code"
  ];

  // Escape fields that might contain commas, quotes, or newlines
  const escapeCsvField = (field: string | null | undefined): string => {
    if (!field) return "";

    if (field.includes(",") || field.includes("\"") || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  // Create CSV content
  const csvContent = [
    // Add headers
    headers.join(","),

    // Add data rows with null checks
    ...predictions.map(prediction => {
      // Safely destructure with null checks
      const {
        game,
        predictionType = "",
        odds = 0,
        status = "unknown",
        description = "",
        bookmaker = "",
        gameCode = ""
      } = prediction || {};

      if (!game) {
        return Array(headers.length).fill("").join(",");
      }

      const {
        homeTeam = { name: "Unknown" },
        awayTeam = { name: "Unknown" },
        league = "",
        sport = "",
        startTime
      } = game;

      // Format game time with null check
      const gameTime = startTime
        ? new Date(startTime).toLocaleString()
        : "Unknown time";

      // Format game name with null checks
      const gameName = `${homeTeam?.name || "Unknown"} vs ${awayTeam?.name || "Unknown"}`;

      return [
        escapeCsvField(gameName),
        escapeCsvField(league),
        escapeCsvField(sport),
        escapeCsvField(predictionType),
        odds.toString(),
        status,
        gameTime,
        escapeCsvField(description),
        escapeCsvField(bookmaker),
        escapeCsvField(gameCode)
      ].join(",");
    })
  ].join("\n");

  return csvContent;
};

/**
 * Download data as a CSV file
 */
export const downloadCSV = (data: string, filename: string = "export.csv"): void => {
  // Create a blob with the CSV data
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });

  // Create a download link
  const link = document.createElement("a");

  // Set link properties
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  // Append link to body
  document.body.appendChild(link);

  // Trigger download
  link.click();

  // Clean up
  document.body.removeChild(link);
};

/**
 * Generate a simple PDF from predictions (browser-based)
 * Note: For a production app, you might want to use a more robust PDF library
 */
export const generatePredictionsPDF = (predictions: Prediction[]): void => {
  // Validate input
  if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
    alert("No predictions available to export");
    return;
  }

  // Create a new window for the PDF
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Please allow popups to generate PDF");
    return;
  }

  // Create HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Predictions Export</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          color: #333;
          border-bottom: 1px solid #ccc;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .status-won {
          color: green;
          font-weight: bold;
        }
        .status-lost {
          color: red;
        }
        .status-pending {
          color: orange;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>Predictions Export</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>

      <table>
        <thead>
          <tr>
            <th>Game</th>
            <th>League</th>
            <th>Prediction</th>
            <th>Odds</th>
            <th>Status</th>
            <th>Game Time</th>
          </tr>
        </thead>
        <tbody>
          ${predictions.map(prediction => {
    // Skip invalid predictions
    if (!prediction || !prediction.game) {
      return '';
    }

    // Safely destructure with null checks
    const {
      game,
      predictionType = "",
      odds = 0,
      status = "unknown"
    } = prediction;

    const {
      homeTeam = { name: "Unknown" },
      awayTeam = { name: "Unknown" },
      league = "",
      startTime
    } = game || {};

    // Format game time with null check
    const gameTime = startTime
      ? new Date(startTime).toLocaleString()
      : "Unknown time";

    // Format game name with null checks
    const gameName = `${homeTeam?.name || "Unknown"} vs ${awayTeam?.name || "Unknown"}`;

    // Format odds with null check
    const formattedOdds = typeof odds === 'number' ? odds.toFixed(2) : "0.00";

    // Format status with null check
    const formattedStatus = status ? status.toUpperCase() : "UNKNOWN";

    return `
              <tr>
                <td>${gameName}</td>
                <td>${league}</td>
                <td>${predictionType}</td>
                <td>${formattedOdds}</td>
                <td class="status-${status}">${formattedStatus}</td>
                <td>${gameTime}</td>
              </tr>
            `;
  }).join("")}
        </tbody>
      </table>

      <div class="footer">
        <p>BetSightly - Your Trusted Prediction Platform</p>
      </div>

      <script>
        // Auto print when loaded
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  // Write HTML to the new window
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

/**
 * Share content via navigator.share API (mobile devices)
 */
export const sharePredictions = async (predictions: Prediction[], title: string): Promise<boolean> => {
  // Validate input
  if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
    return false;
  }

  // Check if the Web Share API is available
  if (!navigator.share) {
    return false;
  }

  try {
    // Create share text with comprehensive null checks
    const shareText = predictions.map(prediction => {
      if (!prediction || !prediction.game) {
        return "Unknown prediction";
      }

      // Safely destructure with null checks
      const {
        game,
        predictionType = "Unknown",
        odds = 0,
        status = "unknown"
      } = prediction;

      const {
        homeTeam = { name: "Unknown" },
        awayTeam = { name: "Unknown" }
      } = game;

      // Format odds with null check
      const formattedOdds = typeof odds === 'number' ? odds.toFixed(2) : "0.00";

      // Format status with null check
      const formattedStatus = status ? status.toUpperCase() : "UNKNOWN";

      // Format team names with null checks
      const homeTeamName = homeTeam?.name || "Unknown";
      const awayTeamName = awayTeam?.name || "Unknown";

      return `${homeTeamName} vs ${awayTeamName} - ${predictionType} (${formattedOdds}) - ${formattedStatus}`;
    }).join("\n");

    // Share content
    await navigator.share({
      title: title || "BetSightly Predictions",
      text: `Check out these predictions:\n\n${shareText}\n\nShared from BetSightly`,
      url: window.location.href
    });

    return true;
  } catch (error) {
    console.error("Error sharing content:", error);
    return false;
  }
};

