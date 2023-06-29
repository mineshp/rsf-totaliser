export interface PaymentResponse {
  id: string;
  amount_captured: number;
  created: number;
  description: string | null;
  donationMethod: string;
}

export interface ChargesResponse {
  // totals: {
  //   stripeMerch: number;
  //   stripeDonation: number;
  //   generalDonation: number;
  //   runningTotal: number;
  // };
  hourly: {
    [key: string]: {
      stripeMerch: number;
      stripeDonation: number;
      generalDonation: number;
      runningTotal: number;
    };
  };
}

export interface HourlyData {
  [hour: string]: {
    stripeMerch: number;
    stripeDonation: number;
    generalDonation: number;
    runningTotal: number;
  };
}
