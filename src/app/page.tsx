import Link from "next/link";
import { MarketingHeader } from "@/components/layout/marketing-header";
import {
  GraduationCap,
  Building2,
  BookOpen,
  Users,
  Shield,
  Smartphone,
  BarChart3,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Mosque,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Building2,
    title: "মাল্টি-টেন্যান্ট SaaS",
    description: "প্রতিটি প্রতিষ্ঠানের নিজস্ব স্পেস, ব্র্যান্ডিং ও সাবডোমেইন। ডেটা সম্পূর্ণ আইসোলেটেড।",
  },
  {
    icon: BookOpen,
    title: "হিফজুল কুরআন ট্র্যাকিং",
    description: "সবক, সবকি ও মঞ্জিল আলাদাভাবে ট্র্যাক। সূরা/জুজ/পৃষ্ঠা-ওয়াইজ প্রোগ্রেস ও অভিভাবক রিয়েল-টাইম আপডেট।",
  },
  {
    icon: GraduationCap,
    title: "BMEB & BEFAQ সাপোর্ট",
    description: "আলিয়া ও কওমি উভয় বোর্ডের কারিকুলাম, পরীক্ষা রেজিস্ট্রেশন ও রেজাল্ট ফরম্যাট।",
  },
  {
    icon: CreditCard,
    title: "লোকাল পেমেন্ট",
    description: "bKash, Nagad, Rocket ও কার্ড। অটো ইনভয়েস, কিস্তি ও স্কলারশিপ ম্যানেজমেন্ট।",
  },
  {
    icon: Users,
    title: "সম্পূর্ণ SIS + অ্যাটেনডেন্স",
    description: "QR/বায়োমেট্রিক উপস্থিতি, স্টুডেন্ট প্রোফাইল, প্রমোশন, TC ও সিবলিং লিংক।",
  },
  {
    icon: Smartphone,
    title: "মোবাইল-ফার্স্ট",
    description: "অভিভাবক ও শিক্ষার্থী অ্যাপ + স্টাফ অ্যাপ। পুশ নোটিফিকেশন ও SMS গেটওয়ে।",
  },
  {
    icon: BarChart3,
    title: "রিপোর্টিং ও অ্যানালিটিক্স",
    description: "এনরোলমেন্ট, ফি কালেকশন, অ্যাটেনডেন্স ও একাডেমিক পারফরম্যান্স ড্যাশবোর্ড।",
  },
  {
    icon: Shield,
    title: "প্রোডাকশন-গ্রেড সিকিউরিটি",
    description: "RBAC, অডিট ট্রেইল, এনক্রিপশন, 2FA ও চাইল্ড ডেটা প্রাইভেসি কমপ্লায়েন্স।",
  },
];

const plans = [
  {
    name: "Basic",
    price: "২,৯৯৯",
    period: "/মাস",
    description: "ছোট স্কুল/মাদ্রাসার জন্য",
    features: ["৫০০ শিক্ষার্থী পর্যন্ত", "কোর মডিউল", "SMS ৫০০/মাস", "বেসিক সাপোর্ট"],
  },
  {
    name: "Standard",
    price: "৫,৯৯৯",
    period: "/মাস",
    description: "মাঝারি প্রতিষ্ঠানের জন্য",
    features: ["১৫০০ শিক্ষার্থী", "হিফজ ট্র্যাকিং", "পেমেন্ট গেটওয়ে", "WhatsApp API", "প্রায়োরিটি সাপোর্ট"],
    popular: true,
  },
  {
    name: "Premium",
    price: "৯,৯৯৯",
    period: "/মাস",
    description: "বড় স্কুল/চেইনের জন্য",
    features: ["আনলিমিটেড শিক্ষার্থী", "সব মডিউল", "মাল্টি-ক্যাম্পাস", "কাস্টম রিপোর্ট", "ডেডিকেটেড সাপোর্ট"],
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-background to-background dark:from-emerald-950/40" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="success" className="mb-6">
              বাংলাদেশের জন্য বিশেষভাবে ডিজাইন করা
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              স্কুল, কলেজ ও মাদ্রাসার{" "}
              <span className="text-emerald-600">একক প্ল্যাটফর্ম</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              প্রোডাকশন-গ্রেড মাল্টি-টেন্যান্ট SaaS। হিফজ ট্র্যাকিং, BMEB/BEFAQ, bKash/Nagad,
              অ্যাটেনডেন্স, ফি ম্যানেজমেন্ট ও আরও অনেক কিছু — এক জায়গায়।
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">
                  শুরু করুন — ১৪ দিন ফ্রি <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">ফিচার দেখুন</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              ক্রেডিট কার্ড লাগবে না · সেটআপ ৫ মিনিটে · বাংলা UI
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              সবকিছু যা আপনার প্রতিষ্ঠানের দরকার
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              সাধারণ স্কুল সফটওয়্যার যেখানে দুর্বল, সেখানেই আমাদের শক্তি — মাদ্রাসা মডিউল।
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/60 transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules highlight */}
      <section id="modules" className="border-y border-border/40 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-4">
                মাদ্রাসা ডিফারেন্সিয়েটর
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                হিফজ ট্র্যাকিং যা অন্যদের নেই
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                সবক (নতুন হিফজ), সবকি (সাম্প্রতিক রিভিশন) ও মঞ্জিল (পুরনো রিভিশন) — তিনটি স্ট্রিম আলাদাভাবে।
                সূরা/জুজ/পৃষ্ঠা-ওয়াইজ প্রোগ্রেস, তিলাওয়াত স্কোরিং ও অভিভাবক পোর্টালে রিয়েল-টাইম আপডেট।
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "হিজরি ক্যালেন্ডার ও রমজান/ঈদ অটো-অ্যাডজাস্ট",
                  "নামাজ মনিটরিং (আবাসিক ছাত্রদের জন্য)",
                  "যাকাত/অনুদান ব্যবস্থাপনা ও স্বচ্ছতা রিপোর্ট",
                  "BMEB ও BEFAQ উভয় বোর্ড কনফিগারযোগ্য",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <Card className="overflow-hidden shadow-xl">
                <CardHeader className="border-b bg-emerald-600 text-white">
                  <CardTitle className="text-white">হিফজ প্রোগ্রেস — আজকের সবক</CardTitle>
                  <CardDescription className="text-emerald-100">
                    জুজ ১২ · সূরা ইউনুস · পৃষ্ঠা ২১৮-২২০
                  </CardDescription>
                </CardHeader>
                <CardContent className="page-pad">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">সবক সম্পন্ন</span>
                    <span className="font-semibold text-emerald-600">৮৫%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full w-[85%] rounded-full bg-emerald-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <div className="text-lg font-bold">১২</div>
                      <div className="text-xs text-muted-foreground">সবক</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <div className="text-lg font-bold">৮</div>
                      <div className="text-xs text-muted-foreground">সবকি</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <div className="text-lg font-bold">৫</div>
                      <div className="text-xs text-muted-foreground">মঞ্জিল</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              সহজ ও স্বচ্ছ প্রাইসিং
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              মাসিক বা বাৎসরিক — যা আপনার সুবিধা। ১৪ দিন ফ্রি ট্রায়াল।
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.popular ? "border-emerald-500 shadow-lg ring-1 ring-ring" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>সবচেয়ে জনপ্রিয়</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">৳{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/login">ট্রায়াল শুরু করুন</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-emerald-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            আজই আপনার প্রতিষ্ঠান ডিজিটাল করুন
          </h2>
          <p className="mt-4 text-lg text-emerald-100">
            সেটআপ উইজার্ড দিয়ে ৫ মিনিটে শুরু। কোনো ক্রেডিট কার্ড লাগবে না।
          </p>
          <Button
            size="lg"
            className="mt-8 bg-card text-emerald-700 hover:bg-emerald-50"
            asChild
          >
            <Link href="/login">
              ফ্রি ট্রায়াল শুরু করুন <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
                <Mosque className="h-4 w-4" />
              </div>
              <span className="font-semibold">Edupro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Edupro. বাংলাদেশের শিক্ষা প্রতিষ্ঠানের জন্য নির্মিত।
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
