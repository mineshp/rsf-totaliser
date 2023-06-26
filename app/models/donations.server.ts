import Stripe from "stripe";
import type { ChargesResponse, HourlyData } from "~/types/donation";
const stripe = new Stripe(
  "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",
  {
    apiVersion: "2022-11-15",
    maxNetworkRetries: 2,
  }
);

export async function getAllPayments(): Promise<ChargesResponse> {
  const limit = 100; // Adjust the limit as needed
  let allPayments: any[] = [];
  let startingAfter: string | null = null;
  let today = new Date();
  const yesterday = new Date(today);

  yesterday.setDate(yesterday.getDate() - 1);

  yesterday.setHours(5);
  yesterday.setSeconds(0);
  yesterday.setMinutes(0);

  today.setHours(8);
  today.setMinutes(0);
  today.setSeconds(0);
  const startTimestamp = Math.floor(yesterday.getTime() / 1000);
  const endOfDay = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate(),
    23,
    59,
    59
  );
  const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

  let listParams: any = {
    created: { gte: startTimestamp, lte: endTimestamp },
    limit: limit,
    status: "succeeded",
  };

  while (true) {
    const payments = (await stripe.charges.list(
      listParams
    )) as Stripe.ApiList<Stripe.Charge>;
    allPayments = allPayments.concat(payments.data);

    if (!payments.has_more) {
      break;
    }

    startingAfter = payments.data[payments.data.length - 1].id;
    listParams = {
      ...listParams,
      starting_after: startingAfter,
    };
  }

  return calculateRunningTotal(allPayments);
}

const calculateRunningTotal = (payments: any): ChargesResponse => {
  const totals = {
    stripeMerch: 0,
    stripeDonation: 0,
    generalDonation: 0,
    runningTotal: 0,
  };
  const hourly: HourlyData = {};

  payments.forEach((payment: any) => {
    const {
      amount_captured,
      created,
      description,
      metadata: { donationMethod },
    } = payment;

    // Update the running totals based on the donation type and Stripe filter
    if (donationMethod?.startsWith("Stripe")) {
      if (description.match(/Merchandise/i)) {
        totals.stripeMerch += amount_captured / 100;
      } else if (description.match(/Donations/i)) {
        totals.stripeDonation += amount_captured / 100;
      }
    } else if (description.match(/GiveTap/i)) {
      totals.stripeMerch += amount_captured / 100;
    } else if (description.match(/donation/i)) {
      totals.generalDonation += amount_captured / 100;
    }

    // Calculate the running total
    totals.runningTotal += amount_captured / 100;

    // Calculate the hourly totals and group totals
    const createdDate = new Date(created * 1000);
    const hour = String(createdDate.getHours()).padStart(2, "0");

    if (!hourly[hour as string]) {
      hourly[hour] = {
        stripeMerch: 0,
        stripeDonation: 0,
        generalDonation: 0,
        runningTotal: 0,
      };
    }

    if (donationMethod?.startsWith("Stripe")) {
      if (description.match(/Merchandise/i)) {
        hourly[hour].stripeMerch += amount_captured / 100;
      } else if (description.match(/Donations/i)) {
        hourly[hour].stripeDonation += amount_captured / 100;
      }
    } else if (description.match(/GiveTap/i)) {
      hourly[hour].stripeMerch += amount_captured / 100;
    } else if (
      description.match(/donation/i) &&
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(description)
    ) {
      hourly[hour].generalDonation += amount_captured / 100;
    }

    hourly[hour].runningTotal += amount_captured / 100;
  });

  return {
    totals,
    hourly,
  };
};
