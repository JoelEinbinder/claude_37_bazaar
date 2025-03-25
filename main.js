export default function (input) {
  // Handle empty input case
  if (input.length === 0) {
    return createDefaultCard();
  }

  const extractedTooltips = extractTooltips(input);
  const abilities = createAbilities(extractedTooltips);
  const auras = createAuras(extractedTooltips);
  const tiers = createTiers(extractedTooltips, abilities, auras);
  const localization = createLocalization(extractedTooltips);

  return {
    Abilities: abilities,
    Auras: auras,
    Tiers: tiers,
    Localization: localization
  };
}

function createDefaultCard() {
  return {
    Abilities: {},
    Auras: {},
    Tiers: {
      Diamond: {
        Attributes: {
          Multicast: 1,
          BuyPrice: 40
        },
        AbilityIds: [],
        AuraIds: [],
        TooltipIds: []
      }
    },
    Localization: {
      Description: null,
      Tooltips: []
    }
  };
}

function extractTooltips(input) {
  // Extract the tooltip information from the input
  // Group tooltips by type and extract values
  const tooltips = {
    active: [],
    passive: [],
    cooldown: [],
    price: []
  };

  input.forEach(tooltip => {
    const tiers = Object.keys(tooltip);
    
    tiers.forEach(tier => {
      const text = tooltip[tier];
      
      if (text.includes("Cooldown")) {
        if (!tooltips.cooldown[tier]) tooltips.cooldown[tier] = {};
        
        const cooldownMatch = text.match(/Cooldown (\d+) seconds/);
        if (cooldownMatch) {
          tooltips.cooldown[tier].cooldown = parseInt(cooldownMatch[1]) * 1000; // Convert to milliseconds
        }
      } else if (text.match(/Buy for \d+ gold\. Sell for \d+ gold\./)) {
        if (!tooltips.price[tier]) tooltips.price[tier] = {};
        
        const priceMatch = text.match(/Buy for (\d+) gold\. Sell for (\d+) gold\./);
        if (priceMatch) {
          tooltips.price[tier].buyPrice = parseInt(priceMatch[1]);
          tooltips.price[tier].sellPrice = parseInt(priceMatch[2]);
        }
      } else if (text.match(/^Deal \d+ damage\./)) {
        if (!tooltips.active[tier]) tooltips.active[tier] = [];
        tooltips.active[tier].push({
          text,
          type: 'damage',
          value: parseInt(text.match(/Deal (\d+) damage/)[1])
        });
      } else if (text.includes("crit damage")) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        tooltips.passive[tier].push({
          text,
          type: 'critDamage'
        });
      } else if (text.includes("When you heal")) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        const damageMatch = text.match(/gains (\d+) damage/);
        if (damageMatch) {
          tooltips.passive[tier].push({
            text,
            type: 'healTrigger',
            value: parseInt(damageMatch[1])
          });
        }
      } else if (text.includes("Shield value")) {
        if (!tooltips.active[tier]) tooltips.active[tier] = [];
        tooltips.active[tier].push({
          text,
          type: 'shieldDamage'
        });
      } else if (text.match(/Shield items gain \+\d+ Shield/)) {
        if (!tooltips.active[tier]) tooltips.active[tier] = [];
        const shieldMatch = text.match(/\+(\d+) Shield/);
        tooltips.active[tier].push({
          text,
          type: 'shieldBuff',
          value: parseInt(shieldMatch[1])
        });
      } else if (text.match(/weapons gain \d+ Damage/)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        const damageMatch = text.match(/weapons gain (\d+) Damage/);
        tooltips.passive[tier].push({
          text,
          type: 'weaponDamageBuff',
          value: parseInt(damageMatch[1])
        });
      } else if (text.match(/Haste it for \d+ second/)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        const hasteMatch = text.match(/Haste it for (\d+) second/);
        tooltips.passive[tier].push({
          text,
          type: 'weaponHaste',
          value: parseInt(hasteMatch[1])
        });
      } else if (text.match(/Burn \d+/)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        const burnMatch = text.match(/Burn (\d+)/);
        tooltips.passive[tier].push({
          text,
          type: 'burn',
          value: parseInt(burnMatch[1])
        });
      } else {
        // Default category for unrecognized tooltips
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        tooltips.passive[tier].push({
          text,
          type: 'unknown'
        });
      }
    });
  });

  return tooltips;
}

function createAbilities(tooltips) {
  const abilities = {};
  let abilityCounter = 0;

  // Check for damage ability
  if (tooltips.active && Object.values(tooltips.active).some(tier => tier && tier.some(t => t.type === 'damage'))) {
    abilities[abilityCounter] = createDamageAbility(abilityCounter);
    abilityCounter++;
  }

  // Check for shield damage ability
  if (tooltips.active && Object.values(tooltips.active).some(tier => tier && tier.some(t => t.type === 'shieldDamage'))) {
    abilities[abilityCounter] = createShieldDamageAbility(abilityCounter);
    abilityCounter++;

    // Shield buff often comes with shield damage
    if (tooltips.active && Object.values(tooltips.active).some(tier => tier && tier.some(t => t.type === 'shieldBuff'))) {
      abilities[abilityCounter] = createShieldBuffAbility(abilityCounter);
      abilityCounter++;
    }
  }

  // Check for heal trigger damage buff
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'healTrigger'))) {
    abilities[abilityCounter] = createHealTriggerAbility(abilityCounter);
    abilityCounter++;
  }

  // Check for weapon damage buff
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'weaponDamageBuff'))) {
    abilities[abilityCounter] = createWeaponDamageBuffAbility(abilityCounter);
    abilityCounter++;
  }

  // Check for weapon haste ability
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'weaponHaste'))) {
    abilities[abilityCounter] = createWeaponHasteAbility(abilityCounter);
    abilityCounter++;
  }

  // Check for burn ability
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'burn'))) {
    // Create burn tracking ability
    abilities[abilityCounter + 1] = createBurnTrackingAbility(abilityCounter + 1);
    
    // Create burn ability that checks the tracking
    abilities[abilityCounter] = createBurnAbility(abilityCounter);
    
    abilityCounter += 2;
  }

  return abilities;
}

function createDamageAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnCardFired',
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionPlayerDamage',
      ReferenceValue: null,
      Target: {
        $type: 'TTargetPlayerRelative',
        TargetMode: 'Opponent',
        Conditions: null,
      },
    },
    Prerequisites: null,
    Priority: 'Medium',
  };
}

function createShieldDamageAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnCardFired',
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionPlayerDamage',
      ReferenceValue: null,
      Target: {
        $type: 'TTargetPlayerRelative',
        TargetMode: 'Opponent',
        Conditions: null,
      },
    },
    Prerequisites: null,
    Priority: 'Medium',
  };
}

function createShieldBuffAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnCardFired',
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionCardModifyAttribute',
      Value: {
        $type: 'TReferenceValueCardAttribute',
        Target: {
          $type: 'TTargetCardSelf',
          Conditions: null,
        },
        AttributeType: 'Custom_0',
        DefaultValue: 0,
        Modifier: null,
      },
      AttributeType: 'ShieldApplyAmount',
      Operation: 'Add',
      Duration: {
        $type: 'TDeterminantDuration',
        DurationType: 'UntilEndOfCombat',
      },
      TargetCount: null,
      Target: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfHand',
        ExcludeSelf: false,
        Conditions: {
          $type: 'TCardConditionalHiddenTag',
          Tags: [
            'Shield',
          ],
          Operator: 'Any',
        },
      },
    },
    Prerequisites: null,
    Priority: 'High',
  };
}

function createHealTriggerAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnCardPerformedHeal',
      Subject: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfBoard',
        ExcludeSelf: false,
        Conditions: null,
      },
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionCardModifyAttribute',
      Value: {
        $type: 'TReferenceValueCardAttribute',
        Target: {
          $type: 'TTargetCardSelf',
          Conditions: null,
        },
        AttributeType: 'Custom_0',
        DefaultValue: 0,
        Modifier: {
          ModifyMode: 'Multiply',
          Value: {
            $type: 'TFixedValue',
            Value: 1,
          },
        },
      },
      AttributeType: 'DamageAmount',
      Operation: 'Add',
      Duration: {
        $type: 'TDeterminantDuration',
        DurationType: 'UntilEndOfCombat',
      },
      TargetCount: null,
      Target: {
        $type: 'TTargetCardSelf',
        Conditions: null,
      },
    },
    Prerequisites: null,
    Priority: 'Low',
  };
}

function createWeaponDamageBuffAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnItemUsed',
      Subject: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfHand',
        ExcludeSelf: false,
        Conditions: {
          $type: 'TCardConditionalTag',
          Tags: [
            'Weapon',
          ],
          Operator: 'Any',
        },
      },
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionCardModifyAttribute',
      Value: {
        $type: 'TReferenceValueCardAttribute',
        Target: {
          $type: 'TTargetCardSelf',
          Conditions: null,
        },
        AttributeType: 'Custom_0',
        DefaultValue: 0,
        Modifier: {
          ModifyMode: 'Multiply',
          Value: {
            $type: 'TFixedValue',
            Value: 1,
          },
        },
      },
      AttributeType: 'DamageAmount',
      Operation: 'Add',
      Duration: {
        $type: 'TDeterminantDuration',
        DurationType: 'UntilEndOfCombat',
      },
      TargetCount: null,
      Target: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfHand',
        ExcludeSelf: false,
        Conditions: null,
      },
    },
    Prerequisites: null,
    Priority: 'Low',
  };
}

function createWeaponHasteAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnItemUsed',
      Subject: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfHand',
        ExcludeSelf: false,
        Conditions: {
          $type: 'TCardConditionalTag',
          Tags: [
            'Weapon',
          ],
          Operator: 'Any',
        },
      },
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionCardHaste',
      Target: {
        $type: 'TTargetCardTriggerSource',
        ExcludeSelf: false,
        Conditions: {
          $type: 'TCardConditionalAnd',
          Conditions: [
            {
              $type: 'TCardConditionalTag',
              Tags: [
                'Weapon',
              ],
              Operator: 'Any',
            },
            {
              $type: 'TCardConditionalAttribute',
              Attribute: 'CooldownMax',
              ComparisonOperator: 'GreaterThan',
              ComparisonValue: {
                $type: 'TFixedValue',
                Value: 0,
              },
            },
          ],
        },
      },
    },
    Prerequisites: null,
    Priority: 'Low',
  };
}

function createBurnAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnItemUsed',
      Subject: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfHand',
        ExcludeSelf: true,
        Conditions: {
          $type: 'TCardConditionalSize',
          Sizes: [
            'Large',
          ],
          IsNot: false,
        },
      },
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionPlayerBurnApply',
      ReferenceValue: null,
      Target: {
        $type: 'TTargetPlayerRelative',
        TargetMode: 'Opponent',
        Conditions: null,
      },
    },
    Prerequisites: [
      {
        $type: 'TPrerequisiteCardCount',
        Subject: {
          $type: 'TTargetCardSelf',
          Conditions: {
            $type: 'TCardConditionalAttribute',
            Attribute: 'Custom_0',
            ComparisonOperator: 'Equal',
            ComparisonValue: {
              $type: 'TFixedValue',
              Value: 0,
            },
          },
        },
        Comparison: 'Equal',
        Amount: 1,
      },
    ],
    Priority: 'Medium',
  };
}

function createBurnTrackingAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnItemUsed',
      Subject: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfHand',
        ExcludeSelf: true,
        Conditions: {
          $type: 'TCardConditionalSize',
          Sizes: [
            'Large',
          ],
          IsNot: false,
        },
      },
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionCardModifyAttribute',
      Value: {
        $type: 'TFixedValue',
        Value: 1,
      },
      AttributeType: 'Custom_0',
      Operation: 'Add',
      Duration: {
        $type: 'TDeterminantDuration',
        DurationType: 'UntilEndOfCombat',
      },
      TargetCount: null,
      Target: {
        $type: 'TTargetCardSelf',
        Conditions: null,
      },
    },
    Prerequisites: null,
    Priority: 'Immediate',
  };
}

function createAuras(tooltips) {
  const auras = {};
  let auraCounter = 0;

  // Check for crit damage
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'critDamage'))) {
    auras[auraCounter] = createCritDamageAura(auraCounter);
    auraCounter++;
  }

  // Check for shield damage aura
  if (tooltips.active && Object.values(tooltips.active).some(tier => tier && tier.some(t => t.type === 'shieldDamage'))) {
    auras[auraCounter] = createShieldDamageAura(auraCounter);
    auraCounter++;
  }

  return auras;
}

function createCritDamageAura(id) {
  return {
    Id: id.toString(),
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TAuraActionCardModifyAttribute',
      AttributeType: 'DamageCrit',
      Operation: 'Add',
      Value: {
        $type: 'TFixedValue',
        Value: 300,
      },
      Target: {
        $type: 'TTargetCardSelf',
        Conditions: null,
      },
    },
    Prerequisites: null,
  };
}

function createShieldDamageAura(id) {
  return {
    Id: id.toString(),
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TAuraActionCardModifyAttribute',
      AttributeType: 'DamageAmount',
      Operation: 'Add',
      Value: {
        $type: 'TReferenceValueCardAttribute',
        Target: {
          $type: 'TTargetCardSection',
          TargetSection: 'SelfHand',
          ExcludeSelf: false,
          Conditions: {
            $type: 'TCardConditionalAttributeHighest',
            AttributeType: 'ShieldApplyAmount',
          },
        },
        AttributeType: 'ShieldApplyAmount',
        DefaultValue: 0,
        Modifier: {
          ModifyMode: 'Multiply',
          Value: {
            $type: 'TFixedValue',
            Value: 1,
          },
        },
      },
      Target: {
        $type: 'TTargetCardSelf',
        Conditions: null,
      },
    },
    Prerequisites: null,
  };
}

function createTiers(tooltips, abilities, auras) {
  const tiers = {};
  const tierNames = ['Bronze', 'Silver', 'Gold', 'Diamond'];

  tierNames.forEach(tierName => {
    // Check if this tier exists in any tooltip
    const tierExists = Object.values(tooltips).some(category => 
      category && category[tierName] && (Array.isArray(category[tierName]) 
        ? category[tierName].length > 0 
        : Object.keys(category[tierName]).length > 0)
    );

    if (tierExists || tierName === 'Diamond') { // Always include Diamond for the default case
      tiers[tierName] = createTierInfo(tierName, tooltips, abilities, auras);
    }
  });

  return tiers;
}

function createTierInfo(tierName, tooltips, abilities, auras) {
  const tier = {
    Attributes: {
      Multicast: 1
    },
    AbilityIds: Object.keys(abilities),
    AuraIds: Object.keys(auras),
    TooltipIds: []
  };

  // Set tooltip IDs based on detected abilities and auras
  let tooltipIdCounter = 0;
  
  // Add damage ability tooltip
  if (tooltips.active && tooltips.active[tierName] && tooltips.active[tierName].some(t => t.type === 'damage')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }
  
  // Add crit damage tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'critDamage')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add shield damage tooltip
  if (tooltips.active && tooltips.active[tierName] && tooltips.active[tierName].some(t => t.type === 'shieldDamage')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add shield buff tooltip
  if (tooltips.active && tooltips.active[tierName] && tooltips.active[tierName].some(t => t.type === 'shieldBuff')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add heal trigger tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'healTrigger')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add weapon damage buff tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'weaponDamageBuff')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add weapon haste tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'weaponHaste')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add burn tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'burn')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add attributes
  if (tooltips.cooldown && tooltips.cooldown[tierName]) {
    tier.Attributes.CooldownMax = tooltips.cooldown[tierName].cooldown;
  }

  if (tooltips.price && tooltips.price[tierName]) {
    tier.Attributes.BuyPrice = tooltips.price[tierName].buyPrice;
    tier.Attributes.SellPrice = tooltips.price[tierName].sellPrice;
  } else if (tierName === 'Diamond') {
    tier.Attributes.BuyPrice = 40; // Default for Diamond
  }

  // Add DamageAmount for damage abilities
  if (tooltips.active && tooltips.active[tierName] && tooltips.active[tierName].some(t => t.type === 'damage')) {
    const damageTooltip = tooltips.active[tierName].find(t => t.type === 'damage');
    tier.Attributes.DamageAmount = damageTooltip.value;
  }

  // Add Custom_0 for heal trigger
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'healTrigger')) {
    const healTrigger = tooltips.passive[tierName].find(t => t.type === 'healTrigger');
    tier.Attributes.Custom_0 = healTrigger.value;
  }

  // Add Custom_0 for shield buff
  if (tooltips.active && tooltips.active[tierName] && tooltips.active[tierName].some(t => t.type === 'shieldBuff')) {
    const shieldBuff = tooltips.active[tierName].find(t => t.type === 'shieldBuff');
    tier.Attributes.Custom_0 = shieldBuff.value;
  }

  // Add Custom_0 for weapon buff
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'weaponDamageBuff')) {
    const weaponBuff = tooltips.passive[tierName].find(t => t.type === 'weaponDamageBuff');
    tier.Attributes.Custom_0 = weaponBuff.value;
  }

  // Add HasteAmount for weapon haste
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'weaponHaste')) {
    const hasteTooltip = tooltips.passive[tierName].find(t => t.type === 'weaponHaste');
    tier.Attributes.HasteAmount = hasteTooltip.value * 1000; // Convert to milliseconds
    tier.Attributes.HasteTargets = 1;
  }

  // Add BurnApplyAmount for burn
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'burn')) {
    const burnTooltip = tooltips.passive[tierName].find(t => t.type === 'burn');
    tier.Attributes.BurnApplyAmount = burnTooltip.value;
    tier.Attributes.Custom_0 = 0; // For tracking if burn was already applied
  }

  return tier;
}

function createLocalization(tooltips) {
  const localization = {
    Description: null,
    Tooltips: []
  };
  
  // Add damage tooltip
  const activeTiers = Object.keys(tooltips.active || {});
  if (activeTiers.length > 0) {
    const firstTierWithDamage = activeTiers.find(tier => 
      tooltips.active[tier] && 
      tooltips.active[tier].some(t => t.type === 'damage')
    );
    
    if (firstTierWithDamage) {
      const damageTooltip = tooltips.active[firstTierWithDamage].find(t => t.type === 'damage');
      localization.Tooltips.push({
        Content: {
          Text: 'Deal {ability.0} damage.',
        },
        TooltipType: 'Active',
        Prerequisites: null,
      });
      
      // If this is the only tooltip, also set it as the description
      if (Object.keys(tooltips.active).length === 1 && 
          tooltips.active[firstTierWithDamage].length === 1 && 
          !tooltips.passive) {
        localization.Description = {
          Text: 'Deal {ability.0} damage.',
        };
      }
    }
  }
  
  // Add crit damage tooltip
  const passiveTiers = Object.keys(tooltips.passive || {});
  if (passiveTiers.length > 0) {
    const firstTierWithCrit = passiveTiers.find(tier => 
      tooltips.passive[tier] && 
      tooltips.passive[tier].some(t => t.type === 'critDamage')
    );
    
    if (firstTierWithCrit) {
      const critTooltip = tooltips.passive[firstTierWithCrit].find(t => t.type === 'critDamage');
      localization.Tooltips.push({
        Content: {
          Text: critTooltip.text,
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }
  
  // Add shield damage tooltip
  if (activeTiers.length > 0) {
    const firstTierWithShieldDamage = activeTiers.find(tier => 
      tooltips.active[tier] && 
      tooltips.active[tier].some(t => t.type === 'shieldDamage')
    );
    
    if (firstTierWithShieldDamage) {
      const shieldDamageTooltip = tooltips.active[firstTierWithShieldDamage].find(t => t.type === 'shieldDamage');
      localization.Tooltips.push({
        Content: {
          Text: shieldDamageTooltip.text,
        },
        TooltipType: 'Active',
        Prerequisites: null,
      });
    }
  }
  
  // Add shield buff tooltip
  if (activeTiers.length > 0) {
    const firstTierWithShieldBuff = activeTiers.find(tier => 
      tooltips.active[tier] && 
      tooltips.active[tier].some(t => t.type === 'shieldBuff')
    );
    
    if (firstTierWithShieldBuff) {
      localization.Tooltips.push({
        Content: {
          Text: 'Your Shield items gain +{ability.0} Shield for the fight.',
        },
        TooltipType: 'Active',
        Prerequisites: null,
      });
    }
  }
  
  // Add heal trigger tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithHealTrigger = passiveTiers.find(tier => 
      tooltips.passive[tier] && 
      tooltips.passive[tier].some(t => t.type === 'healTrigger')
    );
    
    if (firstTierWithHealTrigger) {
      localization.Tooltips.push({
        Content: {
          Text: 'When you heal, this gains {ability.1} damage for the fight.',
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add weapon damage buff tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithWeaponBuff = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'weaponDamageBuff')
    );

    if (firstTierWithWeaponBuff) {
      localization.Tooltips.push({
        Content: {
          Text: 'When you use a weapon, your weapons gain {ability.0} Damage for the fight.',
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add weapon haste tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithWeaponHaste = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'weaponHaste')
    );

    if (firstTierWithWeaponHaste) {
      localization.Tooltips.push({
        Content: {
          Text: 'When you use a Weapon, Haste it for {ability.1} second(s).',
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add burn tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithBurn = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'burn')
    );

    if (firstTierWithBurn) {
      localization.Tooltips.push({
        Content: {
          Text: 'The first time you use a Large item each fight, Burn {ability.0}.',
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  return localization;
}