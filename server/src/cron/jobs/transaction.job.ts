import mongoose from "mongoose";
import TransactionModel from "../../models/transaction.model";
import { calculateNextOccurrence } from "../../utils/helper";

export const processRecurringTransactions = async () => {
  if (mongoose.connection.readyState !== 1) {
    return { success: true, processedCount: 0, failedCount: 0 };
  }
  const now = new Date();
  let processedCount = 0;
  let failedCount = 0;

  try {
    const dueTransactions = await TransactionModel.find({
      isRecurring: true,
      nextRecurringDate: { $lte: now },
    }).limit(500);

    console.log(`Starting recurring process for ${dueTransactions.length} transactions`);

    if (dueTransactions.length === 0) {
      return { success: true, processedCount: 0, failedCount: 0 };
    }

    const batchSize = 50;
    for (let i = 0; i < dueTransactions.length; i += batchSize) {
      const batch = dueTransactions.slice(i, i + batchSize);
      const operations: any[] = [];

      for (const tx of batch) {
        const nextDate = calculateNextOccurrence(
          tx.nextRecurringDate!,
          tx.recurringInterval!
        );

        const txObj = tx.toObject();
        delete (txObj as any)._id;
        delete (txObj as any).id;

        operations.push({
          insertOne: {
            document: {
              ...txObj,
              title: `Recurring - ${tx.title}`,
              date: tx.nextRecurringDate,
              isRecurring: false,
              nextRecurringDate: null,
              recurringInterval: null,
              lastProcessed: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        });

        operations.push({
          updateOne: {
            filter: { _id: tx._id },
            update: {
              $set: {
                nextRecurringDate: nextDate,
                lastProcessed: now,
              },
            },
          },
        });
      }

      try {
        await TransactionModel.bulkWrite(operations, { ordered: false });
        processedCount += batch.length;
      } catch (batchError) {
        console.error("Bulk write error for recurring transactions batch:", batchError);
        failedCount += batch.length;
      }
    }

    console.log(`✅ Processed: ${processedCount} recurring transactions`);
    if (failedCount > 0) {
      console.log(`❌ Failed: ${failedCount} recurring transactions`);
    }

    return {
      success: true,
      processedCount,
      failedCount,
    };
  } catch (error: any) {
    console.error("Error occurred processing recurring transactions:", error);
    return {
      success: false,
      error: error?.message,
    };
  }
};
