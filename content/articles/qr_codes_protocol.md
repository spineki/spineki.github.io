+++
title = "Transferring data using QR codes"
description = "A proof-of-concept to share data using QR codes."
date = 2025-07-10

[taxonomies]
tag = ["protocol", "rust"]
+++

## TL;DR

- It is possible to rely on cameras and screens to share data in a _pull-only_ fashion using QR codes.
- QR codes are only one way to do it, it can be generalized to any image-based content sharing.
- The ending condition of the protocol has a fatal flaw, that can be solved by relying on the user.

## Prerequisites

Forget about common sense. This might be one of the least energy-efficient, slowest, device dependent protocol out there.

## Introduction

A few years ago, I was once stuck with two laptops, with a broken wifi connection, a non-working bluetooth antenna and no USB storage in sight to share a simple file between them. Since then, I was looking for ways to share data without relying on any external support or network, even at a very low rate.

As part of this challenge, I set myself the following framework:

- I could only use the two laptops. Thus, I had access to two screens and two webcams. Nothing more.
- Only one-to-one transfers needed to be supported.
- Only one-way transfers needed to be supported.
- Only one document at a time would be sent.
- I did not want to bother with timeouts, retries, etc. to keep the protocol simple.
- And finally, since QR-codes are fun, I wanted to use them to transfer data. (I was only interested in their use, not in creating them from scratch).

## Vocabulary

To make the following easier:

- let $S$ be the $sender$, sending data (bytes from a book, a picture, etc.).
- let $R$ be the $receiver$, receiving the data and saving it as a binary file.

## Basic idea, a QR-code-based protocol

[QR codes](https://www.qrcode.com/en/) are a neat way to share data by scanning them. QR codes come in multiple flavours (numeric, alphanumeric, byte and kana) with different level of [error correction](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction).

Note:

> Once a QR code is printed or displayed on screen, fetching their data is a _pull-only_ process. The reader has to "pull" the information by taking a picture, and analyzing it. Showing a QR code is not enough to send information. A transfer is relying on the Read to ... read [sic] it.

> This currently obvious fact will come out important later

A first basic way to send a file using qr-codes would be the following:

- $S$ side:
  - take its binary content (bytes)
  - turn it into a QR code.
  - show it
- $R$ side:
  - scan until a QR code is detected
  - store the bytes in a file

So something as simple as

$$
S : file \xrightarrow{reading} bytes \xrightarrow{QR\ code\ encoding} QR\ code \xrightarrow{decoding} bytes : R
$$

## It gets more complex

However, this would only work if the whole file content fits within a single QR code. According to [the wikipedia page](https://en.wikipedia.org/wiki/QR_code), a byte QR code has a maximum capacity of $2,953$ bytes ($\sim 2.9kiB$). In order to share a bigger file, we thus need to slice it in chunks.

> From now on, let $chunk$ be the data bytes transferred in a single QR code.

The protocol thus becomes:

$$
S : file \xrightarrow{reading} byte\ stream \xrightarrow{chunking} chunk \xrightarrow{QR\ code\ encoding} QR\ code \xrightarrow{decoding} bytes : R
$$

In an ideal world, $S$ could fire-and-forget the QR codes one after the other and could expect $R$ to read them fast enough while they are on screen. But in our reality, this suffers from majors issues:

1. What if $R$ struggles to read a QR code and $S$ updates the current chunk in the mean time?
2. Even worse, what would happen if two consecutive chunks contain the same bytes? How can $R$ spot the difference between a QR code displayed during a long time or two identical successive QR codes?
3. How can $R$ and $S$ know that the transaction is complete?

We need a proper protocol to fix these issues and make sure both $R$ and $S$ are in sync.

## Protocol

Let's start by taking the point of view of $S$.

$S$ wants to display the next QR code whenever it's possible. To do so, $R$ needs to collaborate and to notify $S$ that it is done reading the current chunk.
There are multiple ways to provide this information. But to keep it simple (and make it debugging-friendly), $R$ can show the number/index of the latest read QR code.
This solves the first point from the previous section.

> Hence, both $R$ and $S$ need to be able to display a QR code. (two screens required)... which implies that both $R$ and $S$ needs to be able to read QR codes! (two webcams).

But how to tell apart two consecutive identical chunk? Let's do exactly what we did with $R$ but on the $S$ side! $S$ can show a QR code by encoding `[current_chunk_index, chunk]`. $R$ can read the QR code, check the `current_chunk_index` and find out if it is a new chunk. This solves the second issue.

The protocol thus becomes :

```protocol: S side

When R displays a QR code encoding the value N
  show a QR encoding [N + 1, chunk_N+1]
```

```protocol: R side
when S show Nth chunk
  decode it
  show a QR code encoding the number N
```

## Let me stop!

Finally, we need to fix the third issue and find a wait to detect the transfer's end. From $R$ point-of-view, knowing in advance the number of chunks would be enough to detect the end of the transfer. "I am expecting X chunks, I received X chunk, the transfer is over".

However, due to the _pull-only_ nature of the protocol, $S$ _cannot_ know when to stop.

Indeed, let's imagine the end of a transfer:

- S: "I am showing the last chunk, but I don't know if R saw it. Thus I have to keep showing it."
- R: "I saw the last chunk! I need to show to S that I indeed received it so we can both stop. But I have to keep showing it until I know for sure that S is aware of it."
- S: "Oh! R has indeed received my latest chunk. I will show my acknowledgement...
  But I cannot stop until I know that R is aware of it."

> ...and they kept talking happily ever after

It horribily looks like a _real_-life example of the [Two general's problem](https://en.wikipedia.org/wiki/Two_Generals%27_Problem).

> Two generals ($S$ and $R$) send messengers (chunks) across a valley (the QR codes) to plan a coordinate attack (the end of the transfer). However, an ennemy faction in the middle (_pull-only_ uncertainty timings) can capture the messengers. It is proven that the generals _cannot_ craft any clever protocol to reach an exact consensus in a finite time.

Since my original goal is to send files between two laptops facing each other, we can rely on a third all-mighty entity, with infinite wisdom and perfect knowledge to help solving this conundrum: the user.

I know, it is kind of cheating. But if $R$ shows a message on the screen "All chunks received, you can now stop $S$" before exiting, the user can now safely stop $S$ manually.

## Full example with a 3-chunk long transfer

```text
S: Shows 3
R: Reads 3 and shows 0 to acknowledge the transaction
S: Reads 0 from R and shows [1, chunk_1]
S: Is too fast and reads 0 again from R. No update since it is showing 1.
R: Reads 1, since 0 + 1 = 1, saves chunk_1 and shows 1
S: Reads 1 from R and shows [2, chunk_2]
R: Reads 2, since 1 + 1 = 2, saves chunk_2 and shows 2
R: Is too fast and reads again [2, chunk_2]. No update since it is showing 2.
S: Reads 2 from R and shows the final [3, chunk_3]
R: Reads 3, since 2 + 1 = 3, saves chunk_3. Thanks to the first transaction, it knows there are no chunk to receives. Exit with a message asking to stop S.

User reads R's message and stops S.
```

If you want to have fun, here are the the QR codes.

### $S$

<table width="100%">
  <tr>
      <th>Number of chunks</th>
      <th>Chunk 1</th>
      <th>Chunk 2</th>
      <th>Chunk 3</th>
    </tr>
  <tr>
    <td width="25%"><image src="/qr_codes/s_0.png" style="max-height:100%; max-width:100%" /></td>
    <td width="25%"><image src="/qr_codes/s_1.png" style="max-height:100%; max-width:100%" /></td>
    <td width="25%"><image src="/qr_codes/s_2.png" style="max-height:100%; max-width:100%" /></td>
    <td width="25%"><image src="/qr_codes/s_3.png" style="max-height:100%; max-width:100%"/></td>
  </tr>
</table>

### $R$

<table width="100%">
  <tr>
      <th>Ack transaction</th>
      <th>Ack Chunk 1</th>
      <th>Ack Chunk 2</th>
    </tr>
  <tr>
    <td width="33%"><image src="/qr_codes/r_0.png" style="max-height:100%; max-width:100%" /></td>
    <td width="33%"><image src="/qr_codes/r_1.png" style="max-height:100%; max-width:100%" /></td>
    <td width="33%"><image src="/qr_codes/r_2.png" style="max-height:100%; max-width:100%" /></td>
  </tr>
</table>

No ack for chunk 3

## Conclusion

It is possible to solve the 3 main issues that arose while designing this protocol.

I am sorry for any network engineer reading this, but it was a fun proof-of-concept to make.

In the end, QR codes are not the interesting part of it, any way of visually encode information would work the same way. This illustrates a basic way to share data using:

- Asynchrous sender and receiver
- Which cannot make sure the other received the information they just sent except by _pulling_ an acknowledgement.
