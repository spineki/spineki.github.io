+++
title = "Closures as iterators"
description = "An attempt to ease the writing of iterators in C++."
date = 2025-04-13

[taxonomies]
tag = ["c++", "rust", "common lisp", "iterator", "closure"]
+++

## TL;DR

- It is possible to use closures to mimic iterators in C++.
- The syntax is concise, and focus on the logic rather than the usual boilerplate.
- However, a little bit of one-time plumbing is required to get it to work with regular C++ iterators and range-based loops.
- Since this methods requires a Sentinel as a iterable::end() value, it is not directly compatible with C++17 std::algorithms.
- However, this issue vanishes with C++20 ranges algorithm.

### Prerequisites:

The following post expects the user to be familiar with C++17 and iterators.

## Introduction

In my work, I often have to deal with iterators to go through data structures while minimizing the number of allocations.

However, writing a 30-line-of-code struct everytime I want to emulate something which can be done with one `yield` in python is really cumbersome and time consuming. I want to focus on the logic, not on the scaffolding.

But in the end, what is an iterator? It is just something which

- can step : `operator++`
- can return the pointed value : `operator*`
- can be compared to detect the end of iteration: `operator!=`

Thus, the struct/class is need to store the inner mutable state pointing to the correct element. While reading the book ["On Lisp", by Paul Graham](https://paulgraham.com/onlisp.html) I was amazed by the way he uses closure capability to maintain an internal mutable state.

Even if we can't emulate the full glory of common lisp closures, we can still have [lambdas](https://en.cppreference.com/w/cpp/language/lambda) in C++ since C++11.

## 1...2...3... Mom, I can count!

Let's try to use a closure to increase a counter.
[Godbolt](<https://godbolt.org/#g:!((g:!((g:!((h:codeEditor,i:(filename:'1',fontScale:14,fontUsePx:'0',j:1,lang:c%2B%2B,selection:(endColumn:14,endLineNumber:16,positionColumn:14,positionLineNumber:16,selectionStartColumn:14,selectionStartLineNumber:16,startColumn:14,startLineNumber:16),source:'%23include+%3Ciostream%3E%0A%0Aint+main()+%7B%0A++++auto+closure+%3D+%5Bcounter+%3D+0%5D()+mutable+%7B%0A++++++++//+Could+be+even+simpler+with%0A++++++++//+return+counter%2B%2B%3B%0A%0A++++++++%2B%2Bcounter%3B%0A++++++++return+counter%3B%0A++++%7D%3B%0A%0A++++std::cout+%3C%3C+closure()+%3C%3C+%22%5Cn%22%3B%0A++++std::cout+%3C%3C+closure()+%3C%3C+%22%5Cn%22%3B%0A++++std::cout+%3C%3C+closure()+%3C%3C+%22%5Cn%22%3B%0A%0A++++return+0%3B%0A%7D'),l:'5',n:'0',o:'C%2B%2B+source+%231',t:'0')),k:50.997203335578966,l:'4',n:'0',o:'',s:0,t:'0'),(g:!((g:!((h:compiler,i:(compiler:g114,filters:(b:'0',binary:'1',binaryObject:'1',commentOnly:'0',debugCalls:'1',demangle:'0',directives:'0',execute:'1',intel:'0',libraryCode:'0',trim:'1',verboseDemangling:'0'),flagsViewOpen:'1',fontScale:14,fontUsePx:'0',j:1,lang:c%2B%2B,libs:!(),options:'-Wall+-O3',overrides:!(),selection:(endColumn:1,endLineNumber:1,positionColumn:1,positionLineNumber:1,selectionStartColumn:1,selectionStartLineNumber:1,startColumn:1,startLineNumber:1),source:1),l:'5',n:'0',o:'+x86-64+gcc+11.4+(Editor+%231)',t:'0')),k:49.002796664421034,l:'4',m:50,n:'0',o:'',s:0,t:'0'),(g:!((h:executor,i:(argsPanelShown:'1',compilationPanelShown:'0',compiler:g114,compilerName:'',compilerOutShown:'0',execArgs:'',execStdin:'',fontScale:14,fontUsePx:'0',j:1,lang:c%2B%2B,libs:!(),options:'-Wall+-O3',overrides:!(),runtimeTools:!(),source:1,stdinPanelShown:'1',tree:0,wrap:'1'),l:'5',n:'0',o:'Executor+x86-64+gcc+11.4+(C%2B%2B,+Editor+%231)',t:'0')),header:(),l:'4',m:50,n:'0',o:'',s:0,t:'0')),k:49.002796664421034,l:'3',n:'0',o:'',t:'0')),l:'2',n:'0',o:'',t:'0')),version:4>)

```cpp
#include <iostream>

int main() {
  auto closure = [counter = 0]() mutable {
    // Could be even simpler with
    // return counter++;
    ++counter;
    return counter;
  };

  std::cout << closure() << "\n";
  std::cout << closure() << "\n";
  std::cout << closure() << "\n";

  return 0;
}
```

```console
0
1
2
```

Simple but effective. The closure's state updates every time we call it.
Note: the mutable keyword is required to update the captured counter variable, which is read-only by default.

## Indexing using a lambda

Now that we know how to count, we should be able to index a vector (or any indexable data structure).

For example, We can capture by reference a vector and iterate on it using the previous closure. [Godbolt](<https://godbolt.org/#g:!((g:!((g:!((h:codeEditor,i:(filename:'1',fontScale:14,fontUsePx:'0',j:1,lang:c%2B%2B,selection:(endColumn:2,endLineNumber:21,positionColumn:2,positionLineNumber:21,selectionStartColumn:2,selectionStartLineNumber:21,startColumn:2,startLineNumber:21),source:'%23include+%3Ciostream%3E%0A%23include+%3Cvector%3E%0A%0Aint+main()+%7B%0A++std::vector%3Cint%3E+vec%7B10,+20,+30%7D%3B%0A%0A++auto+closure+%3D+%5B%26vec,+counter+%3D+0%5D()+mutable+%7B%0A++++auto+elem+%3D+vec%5Bcounter%5D%3B%0A++++%2B%2Bcounter%3B%0A++++return+elem%3B%0A%0A++++//+Could+be+even+simpler+(but+less+readable)+with%0A++++//+return+vec%5Bcounter%2B%2B%5D%3B%0A++%7D%3B%0A%0A++std::cout+%3C%3C+closure()+%3C%3C+%22%5Cn%22%3B%0A++std::cout+%3C%3C+closure()+%3C%3C+%22%5Cn%22%3B%0A++std::cout+%3C%3C+closure()+%3C%3C+%22%5Cn%22%3B%0A%0A++return+0%3B%0A%7D'),l:'5',n:'0',o:'C%2B%2B+source+%231',t:'0')),k:50.997203335578966,l:'4',n:'0',o:'',s:0,t:'0'),(g:!((g:!((h:compiler,i:(compiler:g114,filters:(b:'0',binary:'1',binaryObject:'1',commentOnly:'0',debugCalls:'1',demangle:'0',directives:'0',execute:'1',intel:'0',libraryCode:'0',trim:'1',verboseDemangling:'0'),flagsViewOpen:'1',fontScale:14,fontUsePx:'0',j:1,lang:c%2B%2B,libs:!(),options:'-Wall+-O3',overrides:!(),selection:(endColumn:1,endLineNumber:1,positionColumn:1,positionLineNumber:1,selectionStartColumn:1,selectionStartLineNumber:1,startColumn:1,startLineNumber:1),source:1),l:'5',n:'0',o:'+x86-64+gcc+11.4+(Editor+%231)',t:'0')),k:49.002796664421034,l:'4',m:50,n:'0',o:'',s:0,t:'0'),(g:!((h:executor,i:(argsPanelShown:'1',compilationPanelShown:'0',compiler:g114,compilerName:'',compilerOutShown:'0',execArgs:'',execStdin:'',fontScale:14,fontUsePx:'0',j:1,lang:c%2B%2B,libs:!(),options:'-Wall+-O3',overrides:!(),runtimeTools:!(),source:1,stdinPanelShown:'1',tree:0,wrap:'1'),l:'5',n:'0',o:'Executor+x86-64+gcc+11.4+(C%2B%2B,+Editor+%231)',t:'0')),header:(),l:'4',m:50,n:'0',o:'',s:0,t:'0')),k:49.002796664421034,l:'3',n:'0',o:'',t:'0')),l:'2',n:'0',o:'',t:'0')),version:4>)

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> vec{10, 20, 30};

  auto closure = [&vec, counter = 0]() mutable {
    auto elem = vec[counter];
    ++counter;
    return elem;
    // Could be even simpler (but less readable) with
    // return vec[counter++];
  };

  std::cout << closure() << "\n";
  std::cout << closure() << "\n";
  std::cout << closure() << "\n";

  return 0;
}
```

```console
10
20
30
```

Nice! So we were able to recreate, more-or-less, the equivalent of `operator++ and operator*` using a functor.

## One step too far

Not so fast. We stopped calling the previous closure just in time, but we would get anout-of-boud error if we were to call it once more. We need a built-in way to detect the end of iteration.

We can get some inspiration from other languages, like Rust. In rust, an iterator is just something that must implement the [next()](https://doc.rust-lang.org/std/iter/trait.Iterator.html#tymethod.next) function

```rust
fn next(&mut self) -> Option<Self::Item>
```

Some(value) allows to get the current pointed value,
None means end of iteration.

I love Rust iterators, so I will try to do something similar.
Thankfully, since C++17, we have optionals in the standard library including `#include <optional>`.

> Note: you may want to avoid optional if you ~don't like working with them~ already work with pointers, or if you want to work with refs and you do not want to deal with `std::reference_wrapper`. In this case, you can totally adapt this post, using nullptr for end of iteration and non-null pointers for regular value. It is pretty much straightforward and would result in removing the is_optional related code in the following section.

```cpp
#include <iostream>
#include <vector>
#include <optional>
#include <utility>

int main() {
  std::vector<int> vec{10, 20, 30};

  auto closure = [&vec, counter = std::size_t{0}]() mutable {
    return (counter < vec.size()) ? std::make_optional(vec[counter++])
                                  : std::nullopt;
  };

  while (auto value = closure()) {
    // value is an optional
    std::cout << value.value() << "\n";
  }

  return 0;
}
```

```console
10
20
30
```

Great! So now our closure starts to really act as a mix between and iterable and an iterator.
Life is good, life is great. So are we done?

## Keeping up with CPP expectations.

We were able to iterate on the closure using a [while loop with a declaration condition](https://en.cppreference.com/w/cpp/language/while) in previous section.

However, we cannot do the same on [range-based for loop](https://en.cppreference.com/w/cpp/language/range-for) since it roughly does

```cpp
{
  // Turns...
  for (auto value: iterable) {
    /* Having fun. */
  }

  // ...into.

  for (auto it = iterable.begin() ; it != iterable.end(); ++it)
  {
    auto value = *it;
    /* Having fun. */
  }
}
```

We thus need a way to adapt our closure interface into a c++ iterable one.

### Plumbing time!

#### Iterator

Let's start by wrapping our closure into an iterator.
To begin with, we write a type facility to check if a provided value is an optional.
This is not mandatory, but it will allow the code to break early if the provided closure does not return an optional.

```cpp
#include <type_traits>
#include <optional>

template <typename T> struct is_optional : std::false_type {};
template <typename T> struct is_optional<std::optional<T>> : std::true_type {};
template <typename T> constexpr auto is_optional_v = is_optional<T>::value;
```

Now we can write the basic skeleton of the adapter iterator.

```cpp
template
<typename ClosureT>
class IteratorAdapter {
private:
  // to ease typing, get the Optional type returned by the closure...
  using OptReturnT = std::invoke_result_t<ClosureT>;
  // ... and check if it's really an optional!
  static_assert(is_optional<OptReturnT>());

public:
  // Regular iterators flags expected by the STL.
  // Since we use a functor approach, we can only go forward.
  using iterator_category = std::forward_iterator_tag;
  // Extract the value wrapped by the optional
  using value_type =
      std::remove_reference_t<decltype(*std::declval<OptReturnT>())>;
  using element_type = value_type;
  using pointer = value_type *;
  using reference = value_type &;
  using difference_type = std::ptrdiff_t;

  // Using the const && trick, we make sure that the user transfers
  // the closure's ownership to this adapter.
  IteratorAdapter(const ClosureT &&closure)
    : closure_{std::move(closure)}, current_value_{closure_()} {}

  IteratorAdapter &operator++(){ /* todo, see below */ }
  reference operator*() { /* todo, see below */ }
  bool operator!=(const TODO &) const { /* todo, see below */ }

private:
  ClosureT closure_;
  OptReturnT current_value_;
};
```

Notice here that we call the closure in the constructor. This way, we initialize properly the current_value state to point to the first value of the iteration. While traditional c++ iterators tend to start at the correct beginning and go one step to far at the end, our closure is one step backward.

We can now focus on the `operator++`, `operator*`, `operator!=` methods.

```cpp
/// Prefix increment.
IteratorAdapter &operator++() {
  // Not going past the end.
  assert(current_value_);
  current_value_ = closure_();
  // For types with no move-assignment, we can fallback to the move constructor with.
  // OptReturnT new_value = closure_();
  // if (new_value) {
  //   current_value_.emplace(std::move(new_value).value());
  // } else {
  //   current_value_.reset();
  // }
  return *this;
}
```

`operator*` is the simplest of them all!

```cpp
reference operator*() {
  // Not accessing the value if the iterator reached the end.
  assert(current_value_);
  return *current_value_;
}
```

But what can we do for the `operator!=`? Is there any meaning to comparing our closure-based iterators if it is not to detect the end of iteration?
Let's fix this philosophical question by dodging it an let us introduce a dedicated struct to reify this end concept.

```cpp
struct Sentinel {};
```

And now, we can do.

```cpp
// Two iterators are different.
template <typename OtherClosureT>
bool operator!=(const IteratorAdapter<OtherClosureT> &) const {
  return true;
}

// If the current_value is std::nullopt, the iterator ended (==Sentinel)
// else, it is still iterating and it is not equal to Sentinel.
bool operator!=(const Sentinel &) const {
  return static_cast<bool>(current_value_);
}
```

> Note: the operator!= is not really required if the iterator is just used as glorified pointer. (just ++ and \*). But it will come handy while create iterables in the next section.

Let's add a nice helper function to ease [type deduction](https://en.cppreference.com/w/cpp/language/class_template_argument_deduction) and provide a simpler name.

```cpp
template <typename ClosureT> auto into_iter(ClosureT &&closure) {
  return IteratorAdapter{std::forward<ClosureT>(closure)};
}
```

And...

```cpp
int main() {
  std::vector<int> vec{10, 20, 30};

  auto closure = [&vec, idx = std::size_t{0}]() mutable {
    return idx < vec.size() ? std::make_optional(vec[idx++]) : std::nullopt;
  };

  for (auto value : iter::into_range(std::move(closure))) {
    std::cout << value << "\n";
  }
}
```

```console
10
20
30
```

Hurrah! Thankfully, creating an iterable from this iterator is way easier.

#### Iterable

An iterator should offer two basic functions.

- Returning an iterator pointing to the beginning: `begin()`.
- Returning an iterator pointing past the end: `end()`

```cpp
template <typename ClosureT> class IterableAdapter {
public:
  ///
  IterableAdapter(ClosureT &&closure)
      : iter_{std::forward<ClosureT>(closure)} {}

  IteratorAdapter<ClosureT> begin() const { return iter_; }

  // We use the previously described Sentinel as the end.
  Sentinel end() const { return {}; }

private:
  IteratorAdapter<ClosureT> iter_;
};
```

As for the iterator, let's add a simple wrapper

```cpp
template <typename ClosureT> auto into_iterable(ClosureT &&closure) {
  return IterableAdapter{std::forward<ClosureT>(closure)};
}
```

And...

```cpp
int main() {
  std::vector<int> vec{10, 20, 30};

  auto closure = [&vec, idx = std::size_t{0}]() mutable {
    return idx < vec.size() ? std::make_optional(vec[idx++]) : std::nullopt;
  };

  for (auto value : iter::into_iterable(std::move(closure))) {
    std::cout << value << "\n";
  }
}
```

```console
10
20
30
```

We did it! From an end user point-of-view, the required logic is minimal.

Once the adapters are moved into a header, it just boils down to:

1. Define a closure
2. Wrap it in into_iterable()
3. ?
4. Profit

I can now focus on the logic and not on the boilerplate anymore.

[Godbolt](https://godbolt.org/#z:OYLghAFBqd5QCxAYwPYBMCmBRdBLAF1QCcAaPECAMzwBtMA7AQwFtMQByARg9KtQYEAysib0QXACx8BBAKoBnTAAUAHpwAMvAFYTStJg1DIApACYAQuYukl9ZATwDKjdAGFUtAK4sGe1wAyeAyYAHI%2BAEaYxCAAnADspAAOqAqETgwe3r56KWmOAkEh4SxRMQm2mPYFDEIETMQEWT5%2BXJXVGXUNBEVhkdFxiQr1jc05bcPdvSVlgwCUtqhexMjsHOYAzMHI3lgA1CYbbqIKSo2H2CYaAIKb27uYB0eoSTViF1e3ZlsMO177hzcBAAnklMAB9AjEJiEBQfG53X4PJ5uLyOWiEYHwr4/P4Ao4AN0wDhI2MReMegKcw2ImFYZJuzDYCiSTFWe0I0QO8SsCJuBEwLCSBgFKJBYKZjwAKhc9jSvA4OQpwS83rQ9iA5QR0CAQFQxEpIaDKTyTPEACKHXnXAVCkWUo7ixisaWy%2BWKvDK1UZd5HYY6kDegS%2BtwyjaXcMarUBqFeCFO7lWC1Wz6fW3CpiiwFOyV7MPYPZoBjDTCqJLEPZMNGoJUq14%2B2jgglPc21oPMWiA/O6gliOMpvnXd0EPZCRiOELqs1Jy0ba1pwUZrOO425ty0VLLTD5wsGU57ACSAuhRGI13QTFeXOnn3LeF7ApAnz2ey8aSMewA8q8AEqYAjLAwUottGurBASqAANYQrSCheLQBCQoC66brS%2BYDtcL6TI4yDgkwpzRAQECenWaqAt%2BBB/gBxBARcEBzHMGG3l4EQYsgT43C%2Bb7BMAHLHpmJDgqIArACQwIgf6ur8MQADuDToOCnInoJ9TABhXHvrxvbePGxots%2BL6GZJIC0iwqBEuCtJUNEjCrEhRxYDsToQAAVMZjm0Np5G/v%2BgH5vRjHhupr6aXsVSCuORpgiB2lxlFmDBdxH4pMEx4xX2unRS5iWhVZNm/A6raxZllJmAAbDlPGFgIwyWZg1m0gVEnarqTDoApRa1QQgJ5Y1qwfHOBlJbx%2BBUA1tklc1AavMQo1UPZ86cYe/Gnuel7HhAnUjihcFoQc5XmGVOyoZgjFLYZUbHbtELTsZZlEptG7XYxFqkIWyyNYhxXgtOV1buC9Fmq2N7JoOL5HtEAlnheV4VodLyQ6e1jWPRiYGS%2B%2BFnERyAfZF32BdaF048Qn1Nhl4IgX9tIAwT6N7LS1EMHsLkEAgnrBUDqZLb1E17AjynEC5qM3udlYEY0m244IZM6eCtOiwzgHM8TpPfRzoO3Et6b2mKq4ul%2BrPRDtW7oUtESoJ4fNggLYBgIc5qbTVI4QwLa2w%2BRhvEMbaGyodczVcWI4i5hhmKzReyxglg1LZzYN7Oblv81Dtv247gejuOwRVPtZX%2B1taMK754fYXguEnN1RwJ524aSyTePk/LIex5rIfa5mDpAnrbAGwg0Q7lXVuI6SGyzg7%2Befp7wHw57edOwXIcvmHTO265rOevpI98zP6uWoOd4PuwBne9uu4nT90chxRVF%2Be9dfS2rF%2Bc4//KLjr2Zd48x87lWRAcoIqCKQ2l/HOh0qanXnovIuTMXZQzdseW6LU9QkDkrNZCT0TZ0TAS9Wc84NYLjtO3XWEp9Zf1lDsTGy1IasUwHA68pobhJBYmxDiIcYHUNocQCAwDDqgPQbSf2molI/R5MZaSKD0BoJOv5LBQM0Z4KWjA1aMN4FHFIZGKIwBgio3ztOemUC%2BLRHPhYbku8W4vjHIILO6pXDaLnropecicEmK5tcfe7cWHgxWiQDhkjro7iEUxZMz8bSv0Ie/Yh3c1EFh/jWVKAClJMGoVwvhJ8eHlSwRAvRjNKHQnYco6ICCAxiPkr4jBNcZFBNwaY1MFo9gAHo6l7ElCyNkjwlIuNSnsFgMIGDC3oSHYyRISTECpIIWUQzpxcA0G9Mw0y9gbA0E/RaIcYmn2uiBEwABWKw5UhlvTwOgVQU1dRpAAF7xmnIs5MmyHb%2BxYGiRJ9BMmQOyQco5gI9hDIAHRnMwMLDYAAxUCIBunQVIg2CAEztlvORpYLZ5oBHAoYPBDcrwd5MSWtJPYEBVnFSjEpMC/9AFUPoBAO65k/lYIYs84FaA0Qog%2BXiwEHzzBmC2W4BgrL0UIg1hwBYtBOCbN4H4DgWhSCoE4G4WFxiFBLBWKVDYPBSAEE0HyhYkEQDxAABxfLKoqzZ2rYiSHiBsMqWrJBmH0JwSQwrVXis4LwBQIBpkqtFXy0gcBYAwEQCgVAQo6DRHIJQNA/r6AxGAFwKQfA6DHidRACIdqIjBAaMCTgSqk3MGIMCT8ERtDEldUqkNbBBCfgYLQVNbrSBYAiF4YAbgxC0CddwXgWBulGHEJW/AtIHD3kwE2sVpZiRojWEq1KVQ7UYgiNCLNHgsB2qhHgFgabeBEmIObJQ5pBSGGABiIwqqFhUAMMABQAA1PAmAZLfkYMumQggRBiHYFG/gghFAqHUJW3QbQDB7tMHCyw%2Bg8ARCdZABY7Ym0AFoADqDa9jgc/BsWD/p7a/p2RYLg8ReAUpJgcvt8AFh2HzRkFwDB3CeBaP4Ej0x%2BgxDaHkdIAgxitGSKkejDAqOlAGBMcKPaBBdFGGR8Y7RCO8ZGD0LOMxOO2FE4xvQkxGjsdmFwfDcrVgSH5YK21laJUcD2KoLVZVwNlUkHsYAyBkB7EjV84zEBcCEBIPtRVcxeCuq0AxUgGrJCxC%2BRoDQZh4ixDKoFyQFqpkbGkAKjgNrSBLs2dMkVYrtOOudcq/dHrvUQCQIOnGp4g04uIMe5QhgqhCAQKgGSIrC1%2BqSHQTMGRCuThK2V%2BLvAQ3VbDSACNUbWsBuIKEF0DrSDdbDZ%2BNEjXyt2qy9cfLTbeBZbqPgEVvBn3CFEOIJ9shX1qDtZ%2B/Q26UDSoA0BvD4r6w1U4FBmDcGEPgaQyPFD1h0OYdXcQHDwH6KkGIF4SxbApQW0bcd2VyxVMTG1MEerxXSvjebcq2k7BpkyWhEkZd6mOBCtIM1%2B1HBsCqCHaeXT%2BnDPGdM%2BZyz1mpV/psHsWzePNhKec/uhYvc2oDHexFqLMW4t2sS7YZLLm1XuZAGYLgXzTXmqFxoTZ5V9VastRFjYmmEsDb525iLZgFeYaVwz0gq60jOEkEAA%3D%3D)

<details>
  <summary>Full implementation: </summary>

```cpp
#include <cassert>
#include <optional>
#include <type_traits>
#include <utility>
#include <vector>
#include <iostream>

namespace iter {

template <typename T> struct is_optional : std::false_type {};
template <typename T> struct is_optional<std::optional<T>> : std::true_type {};

template <typename T> constexpr auto is_optional_v = is_optional<T>::value;

struct Sentinel {};

template <typename ClosureT> class IteratorAdapter {
private:
  using OptReturnT = std::invoke_result_t<ClosureT>;
  static_assert(is_optional<OptReturnT>());

public:
  using iterator_category = std::forward_iterator_tag;
  using value_type =
      std::remove_reference_t<decltype(*std::declval<OptReturnT>())>;
  using element_type = value_type;
  using pointer = value_type *;
  using reference = value_type &;
  using const_reference = std::add_const_t<reference>;
  using difference_type = std::ptrdiff_t;

  IteratorAdapter(const ClosureT &&closure)
      : closure_{std::move(closure)}, current_value_{closure_()} {}

  IteratorAdapter &operator++() {
    assert(current_value_);
    current_value_ = closure_();
    return *this;
  }

  reference operator*() {
    assert(current_value_);
    return *current_value_;
  }

  template <typename OtherClosureT>
  bool operator!=(const IteratorAdapter<OtherClosureT> &) const {
    return true;
  }

  bool operator!=(const Sentinel &) const {
    return static_cast<bool>(current_value_);
  }

  template <typename OtherT> bool operator==(const OtherT &other) const {
    return !(*this == other);
  }

private:
  ClosureT closure_;
  OptReturnT current_value_;
};

template <typename ClosureT> auto into_iter(ClosureT &&closure) {
  return IteratorAdapter{std::forward<ClosureT>(closure)};
}

template <typename ClosureT> class IterableAdapter {
public:
  IterableAdapter(ClosureT &&closure) : iter_{std::forward<ClosureT>(closure)} {}

  IteratorAdapter<ClosureT> begin() const { return iter_; }

  Sentinel end() const { return {}; }

private:
  IteratorAdapter<ClosureT> iter_;
};

template <typename ClosureT> auto into_iterable(ClosureT &&closure) {
  return IterableAdapter{std::forward<ClosureT>(closure)};
}

} // namespace iter

int main() {
  std::vector<int> vec{10, 20, 30};

  auto closure = [&vec, idx = std::size_t{0}]() mutable {
    return idx < vec.size() ? std::make_optional(vec[idx++]) : std::nullopt;
  };

  for (auto value : iter::into_iterable(std::move(closure))) {
    std::cout << value << "\n";
  }
}
```

</details>

### Sorry, I may have lied...

If you follow this and try to use the previous iterable with some fancy functional-like STL algorithms from `#include<algorithm>`, you may encounter some compilation errors.

```cpp
int main() {
  std::vector<int> vec{10, 20, 30};

  auto closure = [&vec, idx = std::size_t{0}]() mutable {
    return idx < vec.size() ? std::make_optional(vec[idx++]) : std::nullopt;
  };

  auto iterable = iter::into_iterable(std::move(closure));
  std::vector<int> new_vec;
  std::copy(iterable.begin(), iterable.end(), std::back_inserter(new_vec));
}
```

```console
<source>: In function 'int main()':
<source>:96:12: error: no matching function for call to 'copy(iter::IteratorAdapter<main()::<lambda()> >, iter::Sentinel, std::back_insert_iterator<std::vector<int> >)'
   96 |   std::copy(iterable.begin(), iterable.end(), std::back_inserter(new_vec));
      |   ~~~~~~~~~^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
In file included from /opt/compiler-explorer/gcc-11.4.0/include/c++/11.4.0/vector:60,
                 from <source>:5:
/opt/compiler-explorer/gcc-11.4.0/include/c++/11.4.0/bits/stl_algobase.h:611:5: note: candidate: 'template<class _II, class _OI> _OI std::copy(_II, _II, _OI)'
  611 |     copy(_II __first, _II __last, _OI __result)
      |     ^~~~
/opt/compiler-explorer/gcc-11.4.0/include/c++/11.4.0/bits/stl_algobase.h:611:5: note:   template argument deduction/substitution failed:
<source>:96:12: note:   deduced conflicting types for parameter '_II' ('iter::IteratorAdapter<main()::<lambda()> >' and 'iter::Sentinel')
   96 |   std::copy(iterable.begin(), iterable.end(), std::back_inserter(new_vec));
      |   ~~~~~~~~~^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
I
```

Indeed, STL algorithms are expected to provide `begin()` and `end()` of the same type.

Fair enough, we just need to add constructor to our Sentinel to implicitly be converted into an `IteratorAdapter<>` and...
No, this will never work since IteratorAdapter is generic other a lambda, thus its type is unique...

In really, what we created is not a true iterable. It's is something which looks way more like C++20 [ranges](https://en.cppreference.com/w/cpp/ranges)! (And indeed, the Sentinel terminology comes from there). Range do not need both ends to share the same type. They just need to be comparable.

So instead of pretending we have an iterable, we "just" have to creat a range.

#### Custom Ranges

We already did most of the work for this. However, ranges have more requirements.

- postfix operator (`it++`)

```cpp
IteratorAdapter operator++(int)
{
  auto previous = *this;
  ++*this;
  return previous;
}
```

- `operator==`: negation of `operator!=`

```cpp
template <typename OtherT>
bool operator==(const OtherT &other) const
{
  return !(*this == other);
}
```

- Move constructor (and so spawns the [rule of 5](https://en.cppreference.com/w/cpp/language/rule_of_three)).

```cpp
IteratorAdapter(const IteratorAdapter &) = default;
IteratorAdapter(IteratorAdapter &&) = default;
IteratorAdapter &operator=(const IteratorAdapter &) = default;
IteratorAdapter &operator=(IteratorAdapter &&other)
{
  std::swap(closure_, other.closure_);
  std::swap(current_value_, other.current_value_);
};

IteratorAdapter(const ClosureT &&closure):
    closure_{ std::move(closure) }, current_value_{ closure_() }
{
}

~IteratorAdapter() = default;
```

Let's also rename our IterableAdapter to RangeAdapter and rename the helper function to something more logical.

```cpp
template <typename ClosureT>
auto into_range(ClosureT &&closure)
{
  return RangeAdapter{ std::forward<ClosureT>(closure) };
}
```

And finally we can use it with.

```cpp
int main() {
  std::vector<int> vec{10, 20, 30};

  auto closure = [&vec, idx = std::size_t{0}]() mutable {
    return idx < vec.size() ? std::make_optional(vec[idx++]) : std::nullopt;
  };

  auto range = iter::into_range(std::move(closure));

  std::vector<int> new_vec;
  std::ranges::copy(range, std::back_inserter(new_vec));
  std::cout << "Number of copied elements: " << new_vec.size() << "\n";

  return 0;
}
```

```console
Number of copied elements: 3
```

```Achievement-unlocked
std::ranges' algorithms compatibility.
```

<details>
  <summary>Full implementation:</summary>

```cpp
#include <cassert>
#include <optional>
#include <type_traits>
#include <utility>
#include <vector>
#include <algorithm>
#include <iostream>

namespace iter {

template <typename T>
struct is_optional: std::false_type {
};
template <typename T>
struct is_optional<std::optional<T>>: std::true_type {
};

template <typename T>
constexpr auto is_optional_v = is_optional<T>::value;

struct Sentinel {
};

template <typename ClosureT>
class IteratorAdapter {
private:
  using OptReturnT = std::invoke_result_t<ClosureT>;

public:
  using iterator_category = std::forward_iterator_tag;
  using value_type =
      std::remove_reference_t<decltype(*std::declval<OptReturnT>())>;
  using element_type = value_type;
  using pointer = value_type *;
  using reference = value_type &;
  using const_reference = std::add_const_t<reference>;
  using difference_type = std::ptrdiff_t;

  IteratorAdapter(const IteratorAdapter &) = default;
  IteratorAdapter(IteratorAdapter &&) = default;
  IteratorAdapter &operator=(const IteratorAdapter &) = default;
  IteratorAdapter &operator=(IteratorAdapter &&other)
  {
    std::swap(closure_, other.closure_);
    std::swap(current_value_, other.current_value_);
  };

  IteratorAdapter(const ClosureT &&closure):
      closure_{ std::move(closure) }, current_value_{ closure_() }
  {
  }

  ~IteratorAdapter() = default;

  // prefix
  IteratorAdapter &operator++()
  {
    assert(current_value_);
    current_value_  = closure_();
    return *this;
  }

  // postfix
  IteratorAdapter operator++(int)
  {
    auto previous = *this;
    ++*this;
    return previous;
  }

  reference operator*()
  {
    assert(current_value_);
    return *current_value_;
  }

  const_reference operator*() const
  {
    assert(current_value_);
    return *current_value_;
  }

  template <typename OtherClosureT>
  bool operator!=(const IteratorAdapter<OtherClosureT> &) const
  {
    return true;
  }

  bool operator!=(const Sentinel &) const
  {
    return static_cast<bool>(current_value_);
  }

  template <typename OtherT>
  bool operator==(const OtherT &other) const
  {
    return !(*this == other);
  }

private:
  ClosureT closure_;
  OptReturnT current_value_;
};

template <typename ClosureT>
auto into_iter(ClosureT &&closure)
{
  return IteratorAdapter{ std::forward<ClosureT>(closure) };
}


template <typename ClosureT>
class RangeAdapter {
public:
  RangeAdapter(ClosureT &&closure): iter_{ std::forward<ClosureT>(closure) } { }

  IteratorAdapter<ClosureT> begin() const { return iter_; }

  Sentinel end() const { return {}; }

private:
  IteratorAdapter<ClosureT> iter_;
};

template <typename ClosureT>
auto into_range(ClosureT &&closure)
{
  return RangeAdapter{ std::forward<ClosureT>(closure) };
}

}  // iter

int main() {
  std::vector<int> vec{10, 20, 30};

  auto closure = [&vec, idx = std::size_t{0}]() mutable {
    return idx < vec.size() ? std::make_optional(vec[idx++]) : std::nullopt;
  };

  auto range = iter::into_range(std::move(closure));

  std::vector<int> new_vec;
  std::ranges::copy(range, std::back_inserter(new_vec));
  std::cout << "Number of copied elements: " << new_vec.size() << "\n";

  return 0;
}
```

</details>

## Afterword:

The main goal of this post was to present a little framework that could be reused to ease the writing of Iterators in C++ 17/20.

From what I tested, since closures act a syntaxic sugar for anonymous structs, this is a zero-cost abstraction. See the compilation result of
```cpp
int main() {
  std::array arr{10, 20, 30};

  auto closure = [&arr, idx = std::size_t{0}]() mutable {
    return (idx < arr.size()) ? std::make_optional(arr[idx++]) : std::nullopt;
  };

  int sum{0};
  for (int value: iter::into_range(std::move(closure))) {
    sum += value;
  }
  return sum;
}
```

```asm
main:
  mov     eax, 60
  ret
```

Since the closure types cannot be named, those ranges are not really meant to be stored as members (even if it's possible using templates). They offer a simple interface for quick-and-use-once iterators, as it is more frequent in functional languages.

If STL compatibility is needed, the C++20 range interface of the last section is required. But maybe it could be easier to use a more regular `range + view` approach.

## Acknowledgements

A huge thank you to [Augustin Fabre](https://augfab.dev), who helped me design Adapters' interfaces and sculpt the shapeless idea of closures as iterators.
