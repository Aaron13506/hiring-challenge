# ABOUT.md

## Why this role

When I read what AgentCollect is building it felt like an almost exact match with the kind of work I like. Voice agents, Twilio, LLMs, Stripe, and a team that actually uses the tools they build. The business logic and the product you're putting together is something I'd be really comfortable in. I'm not looking for a stepping stone and I want something long term here.

I also really like working in small teams and startups because I like to contribute and give my opinion, and in places like this you tend to actually get heard. A small example from this test itself, halfway through I realized that comparing the emails against the name was a way to check whether it matched on first name plus last name or just an initial, and being able to act on something like that on the spot is what I enjoy.

## How I work with AI tools

I use Claude Code like a thinking partner and not a code machine. I lay out the architecture and the constraints first and then walk it through each layer with context from what's already there. The decisions stay with me, so how the app is built and what it uses and whether the approach is even the right one is on me. The model speeds up the work but I'm the one deciding the direction. The whole AI pipeline for MotoGearPick was built like that. I defined the schema and the edge cases and Claude Haiku did the classification and then I checked it against real samples before trusting any of it.

And it's not just code, I use it for business logic too. At one point I wanted to import some parts for my own motorcycle so I worked through it with Claude and ended up building an Excel that calculated shipping and taxes and the rest just to see how profitable importing was versus buying locally. Either way it's the same approach. I bring the problem and the constraints and it helps me reason through it and I keep what actually holds up.

## Last project: MotoGearPick

A PCPartPicker style site for comparing motorcycle gear. NestJS backend, PostgreSQL, Redis caching down at 13ms, Next.js SSR for SEO, deployed on AWS with Lightsail, S3, ElastiCache and CloudFront. The AI side ran two pipelines on Claude Haiku through AWS Bedrock batch inference, one for pulling structured data and one for image classification, at around $0.005 per item.

**One ambiguity I faced**

I wasn't sure which model to use for image classification. I figured Gemini would be fine since it was already handling the HTML extraction well but partway through I noticed about half the color classifications were off. Gemini was solid on structured extraction but shaky on images so I split the pipeline and put Claude Haiku on the image part and then reprocessed the ones that were wrong. Now I always test models on real samples before I commit to one.

**One tradeoff I made**

I went with SSR instead of a SPA. The product lives on organic traffic so being invisible to Google wasn't an option. A SPA would have been quicker to build but it would have killed the SEO, so I took the slower route and it was the right call.

**One mistake I made**

Some endpoints were sitting at 400ms and I just put up with it for way too long. The thing is that was the product search and the core of the whole site. Having that lag every time you run a search or apply a filter doesn't feel fluid at all and gives a bad impression, so for that part it was really unacceptable. Once I actually learned how indexes work instead of just slapping one on the foreign key and hoping, and set Redis up properly, it dropped right down and now it sits at 13ms. I should have dealt with it a lot sooner.

**One review comment that changed my mind**

This one was a product call and not a code review. I had built a receipt upload module and the designer added a field to the UI that pointed to data that just doesn't exist in the transaction record. I ended up pulling the actual schema to prove it and that took longer than redesigning the flow would have. That's when it stuck with me to check what data is actually there before touching the UI and not after.

## Something I'd improve about this challenge or your CLAUDE.md

The mock boundary wasn't clear enough in Stage A. PROBLEM.md says you'll use mocked providers in Stage B but it never says whether reading the mock data before committing PLAN.md is okay. That matters because the mock responses have specific edge cases in them like conflicting names, registered agents and single weak sources that would reasonably shape your architecture decisions. One line in Stage A would clear it up without changing the point of the two stages.