import type { V2_MetaFunction } from "@remix-run/node";
import {
  getAllPaymentIntents,
  getAllPayments,
  PaymentIntentsResponse,
} from "../models/donations.server";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useOptionalUser } from "~/utils";

type LoaderData = {
  donations: Awaited<ReturnType<any>>;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const donations = await getAllPayments();

  return json({ donations });
};

export const meta: V2_MetaFunction = () => [{ title: "RSF Totaliser" }];

export default function Index() {
  const { donations } = useLoaderData() as LoaderData;

  const user = useOptionalUser();

  function generateHourlyTimes() {
    var startHour = 5; // 08:00 AM
    var endHour = 21; // 08:00 PM
    var times = [];

    for (var hour = startHour; hour <= endHour; hour++) {
      var time = new Date();
      time.setHours(hour, 0, 0, 0); // Set the current hour and reset minutes, seconds, and milliseconds
      times.push(
        time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }

    return times;
  }

  const hourlyTimes = generateHourlyTimes();

  return (
    <main className="relative min-h-screen bg-red-600 sm:flex sm:items-center sm:justify-center">
      <div className="relative sm:pb-16 sm:pt-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="pb-4 text-center text-2xl">
            <span className="block uppercase text-red-200">RSF Totaliser</span>
          </h1>
          <div className="sm:rounded-lg">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Stripe Tap to Pay Merch Total
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Stripe Tap to Pay Donation Total
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Donation Form (General) Total
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                  <td className="px-6 py-4 text-lg">
                    £{donations.totals.stripeMerch.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-lg">
                    £{donations.totals.stripeDonation.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-lg">
                    £{donations.totals.generalDonation.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-lg">
                    £{donations.totals.runningTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="p-4">
              <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                  <thead className="bg-gray-50 text-xs uppercase text-red-900 dark:bg-gray-200 dark:text-red-900">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Hourly
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Stripe Tap to Pay (Merch)
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Stripe Tap to Pay (Donation)
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Donation Form
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Hourly Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hourlyTimes.map((time) => (
                      <tr
                        className="border-b bg-white dark:border-gray-700"
                        key={time}
                      >
                        <td className="px-6 py-4">{time}</td>
                        <td className="px-6 py-4">
                          {donations.hourly[
                            time.substring(0, 2)
                          ]?.stripeMerch.toFixed(2) ?? "-"}
                        </td>
                        <td className="px-6 py-4">
                          {donations.hourly[
                            time.substring(0, 2)
                          ]?.stripeDonation.toFixed(2) ?? "-"}
                        </td>
                        <td className="px-6 py-4">
                          {donations.hourly[
                            time.substring(0, 2)
                          ]?.generalDonation.toFixed(2) ?? "-"}
                        </td>
                        <td className="px-6 py-4">
                          {donations.hourly[
                            time.substring(0, 2)
                          ]?.runningTotal.toFixed(2) ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
