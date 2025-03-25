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
      } else if (text.match(/Your Weapons have Lifesteal/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        tooltips.passive[tier].push({
          text,
          type: 'weaponLifesteal'
        });
      } else if (text.match(/Your leftmost Weapon has lifesteal/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        tooltips.passive[tier].push({
          text,
          type: 'leftmostWeaponLifesteal'
        });
      } else if (text.match(/Your leftmost Tool has \+(\d+) Multicast/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        const multicastMatch = text.match(/\+(\d+) Multicast/);
        tooltips.passive[tier].push({
          text,
          type: 'leftmostToolMulticast',
          value: parseInt(multicastMatch[1])
        });
      } else if (text.match(/Double the damage of your Large weapons/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        tooltips.passive[tier].push({
          text,
          type: 'largeWeaponDoubleDamage'
        });
      } else if (text.match(/When you Freeze, Reload a Weapon (\d+) ammo/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        const reloadMatch = text.match(/Reload a Weapon (\d+) ammo/);
        tooltips.passive[tier].push({
          text,
          type: 'freezeReloadWeapon',
          value: parseInt(reloadMatch[1])
        });
      } else if (text.match(/Both players['']? weapons have double damage/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        tooltips.passive[tier].push({
          text,
          type: 'bothPlayersWeaponDoubleDamage'
        });
      } else if (text.match(/When you slow, charge (\d+) item (\d+) second/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        const chargeMatch = text.match(/charge (\d+) item (\d+) second/);
        tooltips.passive[tier].push({
          text,
          type: 'slowChargeItem',
          targets: parseInt(chargeMatch[1]),
          value: parseInt(chargeMatch[2])
        });
      } else if (text.match(/Your items have double value during combat/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        tooltips.passive[tier].push({
          text,
          type: 'combatDoubleItemValue'
        });
      } else if (text.match(/Enemy cooldowns are increased by (\d+) second/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        const cooldownMatch = text.match(/increased by (\d+) second/);
        tooltips.passive[tier].push({
          text,
          type: 'enemyCooldownIncrease',
          value: parseInt(cooldownMatch[1])
        });
      } else if (text.match(/When you use a Tool, Reload an adjacent item/i)) {
        if (!tooltips.passive[tier]) tooltips.passive[tier] = [];
        tooltips.passive[tier].push({
          text,
          type: 'toolUseReloadAdjacent'
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

  // Check for freeze reload weapon ability
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'freezeReloadWeapon'))) {
    abilities[abilityCounter] = createFreezeReloadWeaponAbility(abilityCounter);
    abilityCounter++;
  }

  // Check for slow charge item ability
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'slowChargeItem'))) {
    abilities[abilityCounter] = createSlowChargeItemAbility(abilityCounter);
    abilityCounter++;
  }

  // Check for combat double item value ability
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'combatDoubleItemValue'))) {
    abilities[abilityCounter] = createCombatDoubleItemValueAbility(abilityCounter);
    abilityCounter++;
  }

  // Check for tool use reload adjacent ability
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'toolUseReloadAdjacent'))) {
    abilities[abilityCounter] = createToolUseReloadAdjacentAbility(abilityCounter);
    abilityCounter++;
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

function createFreezeReloadWeaponAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnCardPerformedFreeze',
      Subject: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfBoard',
        ExcludeSelf: false,
        Conditions: null,
      },
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionCardReload',
      Target: {
        $type: 'TTargetCardRandom',
        ExcludeSelf: false,
        TargetSection: 'SelfHand',
        Conditions: {
          $type: 'TCardConditionalAnd',
          Conditions: [
            {
              $type: 'TCardConditionalAttribute',
              Attribute: 'CooldownMax',
              ComparisonOperator: 'GreaterThan',
              ComparisonValue: {
                $type: 'TFixedValue',
                Value: 0,
              },
            },
            {
              $type: 'TCardConditionalOr',
              Conditions: [
                {
                  $type: 'TCardConditionalTag',
                  Tags: [
                    'Weapon',
                  ],
                  Operator: 'Any',
                },
              ],
            },
          ],
        },
      },
    },
    Prerequisites: null,
    Priority: 'Lowest',
  };
}

function createSlowChargeItemAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnCardPerformedSlow',
      Subject: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfBoard',
        ExcludeSelf: false,
        Conditions: null,
      },
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionCardCharge',
      Target: {
        $type: 'TTargetCardRandom',
        ExcludeSelf: false,
        TargetSection: 'SelfHand',
        Conditions: {
          $type: 'TCardConditionalAttribute',
          Attribute: 'CooldownMax',
          ComparisonOperator: 'GreaterThan',
          ComparisonValue: {
            $type: 'TFixedValue',
            Value: 0,
          },
        },
      },
    },
    Prerequisites: null,
    Priority: 'Low',
  };
}

function createCombatDoubleItemValueAbility(id) {
  return {
    Id: id.toString(),
    Trigger: {
      $type: 'TTriggerOnFightStarted',
      CombatType: null,
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionCardModifyAttribute',
      Value: {
        $type: 'TFixedValue',
        Value: 2,
      },
      AttributeType: 'SellPrice',
      Operation: 'Multiply',
      Duration: {
        $type: 'TDeterminantDuration',
        DurationType: 'UntilEndOfCombat',
      },
      TargetCount: null,
      Target: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfHand',
        ExcludeSelf: true,
        Conditions: null,
      },
    },
    Prerequisites: null,
    Priority: 'Medium',
  };
}

function createToolUseReloadAdjacentAbility(id) {
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
            'Tool',
          ],
          Operator: 'Any',
        },
      },
    },
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TActionCardReload',
      Target: {
        $type: 'TTargetCardPositional',
        Origin: 'TriggerSource',
        TargetMode: 'Neighbor',
        IncludeOrigin: false,
        Conditions: {
          $type: 'TCardConditionalAttribute',
          Attribute: 'AmmoMax',
          ComparisonOperator: 'GreaterThan',
          ComparisonValue: {
            $type: 'TFixedValue',
            Value: 0,
          },
        },
      },
    },
    Prerequisites: null,
    Priority: 'Lowest',
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

  // Check for weapon lifesteal aura
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'weaponLifesteal'))) {
    auras[auraCounter] = createWeaponLifestealAura(auraCounter);
    auraCounter++;
  }

  // Check for leftmost weapon lifesteal aura
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'leftmostWeaponLifesteal'))) {
    auras[auraCounter] = createLeftmostWeaponLifestealAura(auraCounter);
    auraCounter++;
  }

  // Check for leftmost tool multicast aura
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'leftmostToolMulticast'))) {
    auras[auraCounter] = createLeftmostToolMulticastAura(auraCounter);
    auraCounter++;
  }

  // Check for large weapon double damage aura
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'largeWeaponDoubleDamage'))) {
    auras[auraCounter] = createLargeWeaponDoubleDamageAura(auraCounter);
    auraCounter++;
  }

  // Check for both players' weapons double damage auras
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'bothPlayersWeaponDoubleDamage'))) {
    // Create player weapon double damage aura
    auras[auraCounter] = createPlayerWeaponDoubleDamageAura(auraCounter);
    auraCounter++;
    
    // Create opponent weapon double damage aura
    auras[auraCounter] = createOpponentWeaponDoubleDamageAura(auraCounter);
    auraCounter++;
  }

  // Check for enemy cooldown increase aura
  if (tooltips.passive && Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'enemyCooldownIncrease'))) {
    auras[auraCounter] = createEnemyCooldownIncreaseAura(auraCounter, tooltips);
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

function createWeaponLifestealAura(id) {
  return {
    Id: id.toString(),
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TAuraActionCardModifyAttribute',
      AttributeType: 'Lifesteal',
      Operation: 'Add',
      Value: {
        $type: 'TFixedValue',
        Value: 100,
      },
      Target: {
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
    Prerequisites: null,
  };
}

function createLeftmostWeaponLifestealAura(id) {
  return {
    Id: id.toString(),
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TAuraActionCardModifyAttribute',
      AttributeType: 'Lifesteal',
      Operation: 'Add',
      Value: {
        $type: 'TFixedValue',
        Value: 100,
      },
      Target: {
        $type: 'TTargetCardXMost',
        TargetSection: 'SelfHand',
        TargetMode: 'LeftMostCard',
        ExcludeSelf: true,
        Conditions: {
          $type: 'TCardConditionalTag',
          Tags: [
            'Weapon',
          ],
          Operator: 'Any',
        },
      },
    },
    Prerequisites: null,
  };
}

function createLeftmostToolMulticastAura(id) {
  return {
    Id: id.toString(),
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TAuraActionCardModifyAttribute',
      AttributeType: 'Multicast',
      Operation: 'Add',
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
      Target: {
        $type: 'TTargetCardXMost',
        TargetSection: 'SelfHand',
        TargetMode: 'LeftMostCard',
        ExcludeSelf: true,
        Conditions: {
          $type: 'TCardConditionalAnd',
          Conditions: [
            {
              $type: 'TCardConditionalAttribute',
              Attribute: 'CooldownMax',
              ComparisonOperator: 'GreaterThan',
              ComparisonValue: {
                $type: 'TFixedValue',
                Value: 0,
              },
            },
            {
              $type: 'TCardConditionalTag',
              Tags: [
                'Tool',
              ],
              Operator: 'Any',
            },
          ],
        },
      },
    },
    Prerequisites: null,
  };
}

function createLargeWeaponDoubleDamageAura(id) {
  return {
    Id: id.toString(),
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TAuraActionCardModifyAttribute',
      AttributeType: 'DamageAmount',
      Operation: 'Multiply',
      Value: {
        $type: 'TFixedValue',
        Value: 2,
      },
      Target: {
        $type: 'TTargetCardSection',
        TargetSection: 'SelfHand',
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
              $type: 'TCardConditionalSize',
              Sizes: [
                'Large',
              ],
              IsNot: false,
            },
          ],
        },
      },
    },
    Prerequisites: null,
  };
}

function createPlayerWeaponDoubleDamageAura(id) {
  return {
    Id: id.toString(),
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TAuraActionCardModifyAttribute',
      AttributeType: 'DamageAmount',
      Operation: 'Multiply',
      Value: {
        $type: 'TFixedValue',
        Value: 2,
      },
      Target: {
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
    Prerequisites: null,
  };
}

function createOpponentWeaponDoubleDamageAura(id) {
  return {
    Id: id.toString(),
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TAuraActionCardModifyAttribute',
      AttributeType: 'DamageAmount',
      Operation: 'Multiply',
      Value: {
        $type: 'TFixedValue',
        Value: 2,
      },
      Target: {
        $type: 'TTargetCardSection',
        TargetSection: 'OpponentHand',
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
    Prerequisites: null,
  };
}

function createEnemyCooldownIncreaseAura(id, tooltips) {
  // Find the cooldown increase value from tooltips
  let value = 1000; // Default to 1 second in milliseconds
  
  if (tooltips.passive) {
    const allTiers = Object.values(tooltips.passive);
    for (const tier of allTiers) {
      if (!tier) continue;
      
      const cooldownTooltip = tier.find(t => t.type === 'enemyCooldownIncrease');
      if (cooldownTooltip) {
        value = cooldownTooltip.value * 1000; // Convert to milliseconds
        break;
      }
    }
  }
  
  return {
    Id: id.toString(),
    ActiveIn: 'HandOnly',
    Action: {
      $type: 'TAuraActionCardModifyAttribute',
      AttributeType: 'CooldownMax',
      Operation: 'Add',
      Value: {
        $type: 'TFixedValue',
        Value: value,
      },
      Target: {
        $type: 'TTargetCardSection',
        TargetSection: 'OpponentHand',
        ExcludeSelf: false,
        Conditions: {
          $type: 'TCardConditionalAttribute',
          Attribute: 'CooldownMax',
          ComparisonOperator: 'GreaterThan',
          ComparisonValue: {
            $type: 'TFixedValue',
            Value: 0,
          },
        },
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
    Attributes: {}
  };

  // Set ability and aura IDs
  tier.AbilityIds = Object.keys(abilities);
  tier.AuraIds = Object.keys(auras);
  tier.TooltipIds = [];

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

  // Add weapon lifesteal tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'weaponLifesteal')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add leftmost weapon lifesteal tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'leftmostWeaponLifesteal')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add leftmost tool multicast tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'leftmostToolMulticast')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add large weapon double damage tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'largeWeaponDoubleDamage')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add freeze reload weapon tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'freezeReloadWeapon')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add both players' weapons double damage tooltip (adds two tooltip IDs for the two auras)
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'bothPlayersWeaponDoubleDamage')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add slow charge item tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'slowChargeItem')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add combat double item value tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'combatDoubleItemValue')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add enemy cooldown increase tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'enemyCooldownIncrease')) {
    tier.TooltipIds.push(tooltipIdCounter);
    tooltipIdCounter++;
  }

  // Add tool use reload adjacent tooltip
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'toolUseReloadAdjacent')) {
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

  // Add Custom_0 for leftmost tool multicast
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'leftmostToolMulticast')) {
    const multicastTooltip = tooltips.passive[tierName].find(t => t.type === 'leftmostToolMulticast');
    tier.Attributes.Custom_0 = multicastTooltip.value;
    // Don't add Multicast attribute when we're using the aura to apply it
  } else if (!tooltips.passive || !Object.values(tooltips.passive).some(tier => tier && tier.some(t => t.type === 'leftmostToolMulticast'))) {
    // Only add default Multicast if we're not using the aura and don't have a combat double item value
    if (!(tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'combatDoubleItemValue'))) {
      // Always include Multicast for enemy cooldown increase case
      tier.Attributes.Multicast = 1;
    }
  }

  // Add ReloadAmount and ReloadTargets for freeze reload weapon
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'freezeReloadWeapon')) {
    const reloadTooltip = tooltips.passive[tierName].find(t => t.type === 'freezeReloadWeapon');
    tier.Attributes.ReloadAmount = reloadTooltip.value;
    tier.Attributes.ReloadTargets = 1;
  }

  // Add ReloadAmount and ReloadTargets for tool use reload adjacent
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'toolUseReloadAdjacent')) {
    tier.Attributes.ReloadAmount = 99; // Special case for full reload
    tier.Attributes.ReloadTargets = 1;
  }

  // Add ChargeAmount and ChargeTargets for slow charge item
  if (tooltips.passive && tooltips.passive[tierName] && tooltips.passive[tierName].some(t => t.type === 'slowChargeItem')) {
    const chargeTooltip = tooltips.passive[tierName].find(t => t.type === 'slowChargeItem');
    tier.Attributes.ChargeAmount = chargeTooltip.value * 1000; // Convert to milliseconds
    tier.Attributes.ChargeTargets = chargeTooltip.targets;
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

  // Add weapon lifesteal tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithLifesteal = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'weaponLifesteal')
    );

    if (firstTierWithLifesteal) {
      const lifestealTooltip = tooltips.passive[firstTierWithLifesteal].find(t => t.type === 'weaponLifesteal');
      localization.Tooltips.push({
        Content: {
          Text: lifestealTooltip.text,
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add leftmost weapon lifesteal tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithLeftmostLifesteal = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'leftmostWeaponLifesteal')
    );

    if (firstTierWithLeftmostLifesteal) {
      const leftmostLifestealTooltip = tooltips.passive[firstTierWithLeftmostLifesteal].find(t => t.type === 'leftmostWeaponLifesteal');
      localization.Tooltips.push({
        Content: {
          Text: leftmostLifestealTooltip.text,
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add leftmost tool multicast tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithMulticast = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'leftmostToolMulticast')
    );

    if (firstTierWithMulticast) {
      const multicastTooltip = tooltips.passive[firstTierWithMulticast].find(t => t.type === 'leftmostToolMulticast');
      localization.Tooltips.push({
        Content: {
          Text: multicastTooltip.text,
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add large weapon double damage tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithDoubleDamage = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'largeWeaponDoubleDamage')
    );

    if (firstTierWithDoubleDamage) {
      const doubleDamageTooltip = tooltips.passive[firstTierWithDoubleDamage].find(t => t.type === 'largeWeaponDoubleDamage');
      localization.Tooltips.push({
        Content: {
          Text: doubleDamageTooltip.text,
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add freeze reload weapon tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithFreezeReload = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'freezeReloadWeapon')
    );

    if (firstTierWithFreezeReload) {
      localization.Tooltips.push({
        Content: {
          Text: 'When you Freeze, Reload a Weapon {ability.0} ammo.',
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add both players' weapons double damage tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithBothPlayersDoubleDamage = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'bothPlayersWeaponDoubleDamage')
    );

    if (firstTierWithBothPlayersDoubleDamage) {
      const bothPlayersTooltip = tooltips.passive[firstTierWithBothPlayersDoubleDamage].find(t => t.type === 'bothPlayersWeaponDoubleDamage');
      localization.Tooltips.push({
        Content: {
          Text: bothPlayersTooltip.text,
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add slow charge item tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithSlowCharge = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'slowChargeItem')
    );

    if (firstTierWithSlowCharge) {
      localization.Tooltips.push({
        Content: {
          Text: 'When you slow, charge {ability.0.targets} item {ability.0} second(s).',
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add combat double item value tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithCombatDoubleValue = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'combatDoubleItemValue')
    );

    if (firstTierWithCombatDoubleValue) {
      const doubleValueTooltip = tooltips.passive[firstTierWithCombatDoubleValue].find(t => t.type === 'combatDoubleItemValue');
      localization.Tooltips.push({
        Content: {
          Text: doubleValueTooltip.text,
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add enemy cooldown increase tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithCooldownIncrease = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'enemyCooldownIncrease')
    );

    if (firstTierWithCooldownIncrease) {
      const cooldownIncreaseTooltip = tooltips.passive[firstTierWithCooldownIncrease].find(t => t.type === 'enemyCooldownIncrease');
      localization.Tooltips.push({
        Content: {
          Text: cooldownIncreaseTooltip.text,
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  // Add tool use reload adjacent tooltip
  if (passiveTiers.length > 0) {
    const firstTierWithToolReloadAdjacent = passiveTiers.find(tier => 
      tooltips.passive[tier] &&
      tooltips.passive[tier].some(t => t.type === 'toolUseReloadAdjacent')
    );

    if (firstTierWithToolReloadAdjacent) {
      const toolReloadTooltip = tooltips.passive[firstTierWithToolReloadAdjacent].find(t => t.type === 'toolUseReloadAdjacent');
      localization.Tooltips.push({
        Content: {
          Text: toolReloadTooltip.text,
        },
        TooltipType: 'Passive',
        Prerequisites: null,
      });
    }
  }

  return localization;
}