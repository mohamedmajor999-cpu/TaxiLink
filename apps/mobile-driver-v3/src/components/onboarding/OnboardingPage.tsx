import { OnboardingSlide } from './OnboardingSlide';
import { OnboardingSplash } from './OnboardingSplash';
import { OnboardingWelcome } from './OnboardingWelcome';
import { SlideIlloLongPress } from './SlideIlloLongPress';
import { SlideIlloRgpd } from './SlideIlloRgpd';
import { SlideIlloVoice } from './SlideIlloVoice';
import { useOnboardingPage } from './useOnboardingPage';

export function OnboardingPage() {
  const { step, slideIndex, totalSlides, next, skip, markSeen } = useOnboardingPage();

  if (step === 'splash') return <OnboardingSplash onNext={next} />;
  if (step === 'welcome') return <OnboardingWelcome onEnter={markSeen} />;

  if (step === 'slide1') {
    return (
      <OnboardingSlide
        variant="light"
        title="Prenez des courses en 3 secondes."
        lead="Appuyez longuement sur une course. Elle est à vous. Plus de surenchère, plus de désordre dans le groupe WhatsApp."
        illo={<SlideIlloLongPress />}
        stepIdx={slideIndex}
        total={totalSlides}
        onNext={next}
        onSkip={skip}
      />
    );
  }

  if (step === 'slide2') {
    return (
      <OnboardingSlide
        variant="light"
        title="Dictez, ne tapez plus."
        lead="Publiez une course en 30 secondes sans lâcher le volant. L'IA comprend le jargon chauffeur."
        illo={<SlideIlloVoice />}
        stepIdx={slideIndex}
        total={totalSlides}
        onNext={next}
        onSkip={skip}
      />
    );
  }

  return (
    <OnboardingSlide
      variant="light"
      title={'Vos données restent\nchez vous.'}
      lead="Hébergement souverain en France. Conformité totale CNIL."
      illo={<SlideIlloRgpd />}
      stepIdx={slideIndex}
      total={totalSlides}
      onNext={next}
      onSkip={skip}
      nextLabel="Créer mon compte"
    />
  );
}
